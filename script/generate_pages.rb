#!/usr/bin/env ruby
# frozen_string_literal: true

# 生成 GitHub Pages 不会自动生成的页面：
#   - 每个标签 /tags/<slug>/
#   - 每个分类 /categories/<slug>/
#   - 博客列表第 2 页起 /posts/page/N/
#   - _data/taxonomy.yml，供模板把标签名连到上面的地址
#
# Jekyll 白名单里没有 jekyll-archives，所以这一步用普通 Ruby 完成，
# 不引入额外插件。本地和 GitHub Actions 都要在 jekyll build 之前跑它。

require "yaml"
require "fileutils"
require "date"
require "time"

ROOT = File.expand_path("..", __dir__)
PER_FALLBACK = 4

def slugify(term)
  slug = term.to_s.strip.downcase
  slug = slug.gsub(/\s+/, "-")
  slug = slug.gsub(/[^\p{Han}\p{Alnum}\-]/u, "")
  slug = slug.gsub(/-+/, "-").sub(/\A-/, "").sub(/-\z/, "")
  raise "无法为 #{term.inspect} 生成地址" if slug.empty?
  slug
end

def yaml_quote(text)
  '"' + text.to_s.gsub("\\", "\\\\").gsub('"', '\\"') + '"'
end

def read_config
  YAML.safe_load(File.read(File.join(ROOT, "_config.yml")), aliases: true) || {}
end

def read_posts
  dir = File.join(ROOT, "_posts")
  return [] unless Dir.exist?(dir)

  today = Date.today
  Dir[File.join(dir, "*.md")].filter_map do |path|
    raw = File.read(path, encoding: "UTF-8")
    next unless raw.start_with?("---")
    body = raw.split(/^---\s*$/, 3)[1]
    data = YAML.safe_load(body, permitted_classes: [Date, Time], aliases: true) || {}
    next if data["published"] == false
    draft = data["draft"]
    next if draft == true || draft.to_s == "true"

    date = data["date"]
    date = Date.parse(date.to_s) if date && !date.is_a?(Date)
    # 和 Jekyll 一样，未来日期的文章先不公开，分页和标签页也不计入。
    next if date && date > today

    data
  end
end

def write_term_page(folder, kind, name, slug)
  dir = File.join(ROOT, folder)
  FileUtils.mkdir_p(dir)
  prefix = kind == "tag" ? "tags" : "categories"
  path = File.join(dir, "#{slug}.html")
  File.write(path, <<~HTML)
    ---
    layout: taxonomy
    title: #{yaml_quote(name)}
    taxonomy: #{kind}
    term: #{yaml_quote(name)}
    permalink: "/#{prefix}/#{slug}/"
    ---
  HTML
end

config = read_config
per = (config["list_per_page"] || PER_FALLBACK).to_i
per = PER_FALLBACK if per < 1
posts = read_posts

tag_counts = Hash.new(0)
category_counts = Hash.new(0)
posts.each do |post|
  Array(post["tags"]).each { |tag| tag_counts[tag.to_s] += 1 }
  Array(post["categories"]).each { |category| category_counts[category.to_s] += 1 }
end

FileUtils.rm_rf(File.join(ROOT, "tag"))
FileUtils.rm_rf(File.join(ROOT, "category"))
FileUtils.rm_rf(File.join(ROOT, "posts", "page"))

tag_rows = tag_counts.keys.sort.map do |name|
  slug = slugify(name)
  write_term_page("tag", "tag", name, slug)
  { "name" => name, "slug" => slug, "url" => "/tags/#{slug}/", "count" => tag_counts[name] }
end

category_rows = category_counts.keys.sort.map do |name|
  slug = slugify(name)
  write_term_page("category", "category", name, slug)
  { "name" => name, "slug" => slug, "url" => "/categories/#{slug}/", "count" => category_counts[name] }
end

pages = (posts.length.to_f / per).ceil
pages = 1 if pages < 1
if pages > 1
  dir = File.join(ROOT, "posts", "page")
  FileUtils.mkdir_p(dir)
  (2..pages).each do |number|
    File.write(File.join(dir, "#{number}.html"), <<~HTML)
      ---
      layout: list
      title: 博客
      list_page: #{number}
      permalink: /posts/page/#{number}/
      ---
    HTML
  end
end

taxonomy = {
  "per_page" => per,
  "pages" => pages,
  "tags" => tag_rows,
  "categories" => category_rows
}
File.write(File.join(ROOT, "_data", "taxonomy.yml"), YAML.dump(taxonomy))
puts "taxonomy: #{tag_rows.length} tags, #{category_rows.length} categories, #{pages} list pages"

#!/usr/bin/env ruby
# frozen_string_literal: true

# 把 Obsidian 笔记变成 Jekyll 能发布的文章。
# 在 generate_pages.rb 和 jekyll build 之前跑。
#
# 1. obsidian/ 里 share: true 的笔记，写成 _posts/YYYY-MM-DD-slug.obsidian.md（已 gitignore）。
# 2. 已经在 _posts/ 里、还带着 [[双链]] 或 > [!标注] 的文章，就地改写成 Markdown。
#    第二次再跑不会再改。代码块里的 [[双链]] 保持原样。

require "yaml"
require "fileutils"
require "date"
require "time"
require "digest"

ROOT = File.expand_path("..", __dir__)
POSTS = File.join(ROOT, "_posts")
VAULT = File.join(ROOT, "obsidian")
UPLOADS = File.join(ROOT, "assets", "uploads")

PAGES = {
  "关于" => "/about/",
  "近况" => "/now/",
  "友链" => "/friends/",
  "友情链接" => "/friends/",
  "首页" => "/"
}.freeze

WARNING_TYPES = %w[warning caution attention danger failure bug].freeze

def slugify(term)
  slug = term.to_s.strip.downcase
  slug = slug.gsub(/\s+/, "-")
  slug = slug.gsub(/[^\p{Han}\p{Alnum}\-]/u, "")
  slug = slug.gsub(/-+/, "-").sub(/\A-/, "").sub(/-\z/, "")
  slug
end

def split_front(raw)
  return [{}, raw] unless raw.start_with?("---")

  parts = raw.split(/^---\s*$/, 3)
  return [{}, raw] if parts.length < 3

  data = YAML.safe_load(parts[1], permitted_classes: [Date, Time], aliases: true) || {}
  body = parts[2].sub(/\A\n/, "")
  [data, body]
end

def truthy(value)
  value == true || %w[true yes].include?(value.to_s.strip.downcase)
end

def yaml_quote(text)
  '"' + text.to_s.gsub("\\", "\\\\").gsub('"', '\\"') + '"'
end

def format_scalar(value)
  case value
  when true then "true"
  when false then "false"
  when Integer then value.to_s
  when Time then value.strftime("%Y-%m-%d %H:%M:%S %z")
  when Date then format("%04d-%02d-%02d 09:00:00 +0800", value.year, value.month, value.day)
  else yaml_quote(value)
  end
end

LIST_KEYS = %w[categories tags].freeze
FIELD_ORDER = %w[
  layout title date slug description image image_caption
  categories tags series series_order sample draft share
  exclude_rss generated_from
].freeze

def dump_post(data, body)
  lines = ["---"]
  seen = {}
  FIELD_ORDER.each do |key|
    next unless data.key?(key)
    value = data[key]
    next if value.nil? || value == "" || (value.is_a?(Array) && value.empty?)

    seen[key] = true
    lines << if LIST_KEYS.include?(key)
               "#{key}: [#{Array(value).map { |item| yaml_quote(item) }.join(', ')}]"
             else
               "#{key}: #{format_scalar(value)}"
             end
  end
  data.each do |key, value|
    next if seen[key] || value.nil? || %w[body published].include?(key)
    lines << "#{key}: #{format_scalar(value)}"
  end
  lines << "---"
  lines << ""
  text = body.to_s.sub(/\A\n+/, "").rstrip
  lines << text unless text.empty?
  lines << ""
  lines.join("\n")
end

def note_title(path, data)
  title = data["title"].to_s.strip
  return title unless title.empty?

  File.basename(path, ".md")
end

def planned_date(path, data)
  value = data["date"]
  case value
  when Time
    return value
  when Date
    return Time.new(value.year, value.month, value.day, 9, 0, 0, "+08:00")
  else
    text = value.to_s.strip
    if text =~ /\A(\d{4})-(\d{2})-(\d{2})\z/
      return Time.new(Regexp.last_match(1).to_i, Regexp.last_match(2).to_i, Regexp.last_match(3).to_i, 9, 0, 0, "+08:00")
    end
    return Time.parse(text) unless text.empty?
  end

  base = File.basename(path)
  if base =~ /\A(\d{4})-(\d{2})-(\d{2})/
    return Time.new(Regexp.last_match(1).to_i, Regexp.last_match(2).to_i, Regexp.last_match(3).to_i, 9, 0, 0, "+08:00")
  end

  local = File.mtime(path).getlocal("+08:00")
  Time.new(local.year, local.month, local.day, local.hour, local.min, local.sec, "+08:00")
end

def planned_slug(data, title)
  given = data["slug"].to_s.strip
  from_given = slugify(given)
  return from_given unless from_given.empty?

  from_title = slugify(title)
  return from_title unless from_title.empty?

  "note-" + Digest::SHA1.hexdigest(title.to_s)[0, 8]
end

def planned_url(path, data)
  title = note_title(path, data)
  date = planned_date(path, data)
  slug = planned_slug(data, title)
  format("/%04d/%02d/%02d/%s/", date.year, date.month, date.day, slug)
end

def post_url(path, data)
  base = File.basename(path, ".md")
  return planned_url(path, data) unless base =~ /\A(\d{4})-(\d{2})-(\d{2})-(.+)\z/

  year = Regexp.last_match(1)
  month = Regexp.last_match(2)
  day = Regexp.last_match(3)
  title = Regexp.last_match(4).sub(/\.obsidian\z/, "")
  slug = data["slug"].to_s.strip
  title = slugify(slug) unless slug.empty?
  format("/%s/%s/%s/%s/", year, month, day, title)
end

def remember(index, key, url)
  text = key.to_s.strip
  return if text.empty? || url.nil? || url.empty?

  index[text] ||= url
  pretty = slugify(text)
  index[pretty] ||= url unless pretty.empty?
end

def build_index
  index = PAGES.dup
  Dir[File.join(POSTS, "*.md")].sort.each do |path|
    data, = split_front(File.read(path, encoding: "UTF-8"))
    url = post_url(path, data)
    remember(index, data["title"], url)
    remember(index, File.basename(path, ".md").sub(/\A\d{4}-\d{2}-\d{2}-/, "").sub(/\.obsidian\z/, ""), url)
  end
  return index unless Dir.exist?(VAULT)

  Dir[File.join(VAULT, "**", "*.md")].sort.each do |path|
    data, = split_front(File.read(path, encoding: "UTF-8"))
    next unless truthy(data["share"])

    url = planned_url(path, data)
    remember(index, note_title(path, data), url)
    remember(index, File.basename(path, ".md"), url)
    remember(index, data["slug"], url)
  end
  index
end

def find_asset(name)
  clean = name.to_s.strip.sub(%r{\A\./}, "")
  base = File.basename(clean)
  direct = [
    File.join(VAULT, "attachments", clean),
    File.join(VAULT, "attachments", base),
    File.join(ROOT, "assets", "uploads", clean),
    File.join(ROOT, "assets", "uploads", base),
    File.join(ROOT, "assets", "covers", base),
    File.join(ROOT, "assets", base),
    File.join(ROOT, clean)
  ]
  hit = direct.find { |path| File.file?(path) }
  return hit if hit

  [File.join(VAULT, "attachments"), File.join(ROOT, "assets")].each do |dir|
    next unless Dir.exist?(dir)

    found = Dir[File.join(dir, "**", base)].find { |path| File.file?(path) }
    return found if found
  end
  nil
end

def public_asset(path)
  relative = path.sub(/\A#{Regexp.escape(ROOT)}\//, "")
  return "/#{relative}" if relative.start_with?("assets/")

  FileUtils.mkdir_p(UPLOADS)
  dest = File.join(UPLOADS, File.basename(path))
  same = File.file?(dest) && File.size(dest) == File.size(path)
  FileUtils.cp(path, dest) unless same
  "/assets/uploads/#{File.basename(path)}"
end

def protect(text, pattern, bucket, tag)
  text.gsub(pattern) do |block|
    bucket << block
    "\u0000#{tag}#{bucket.length - 1}\u0000"
  end
end

def restore(text, bucket, tag)
  text.gsub(/\u0000#{tag}(\d+)\u0000/) { bucket[Regexp.last_match(1).to_i] }
end

def convert_callouts(text)
  lines = text.split("\n", -1)
  out = []
  index = 0
  while index < lines.length
    line = lines[index]
    unless line =~ /\A> \[!([A-Za-z]+)\][ \t]*(.*)\z/
      out << line
      index += 1
      next
    end

    kind = Regexp.last_match(1).downcase
    title = Regexp.last_match(2).to_s.strip
    index += 1
    body = []
    while index < lines.length && lines[index].start_with?(">") && lines[index] !~ /\A> \[![A-Za-z]+\]/
      body << lines[index].sub(/\A>\s?/, "")
      index += 1
    end
    names = WARNING_TYPES.include?(kind) ? "book-hint warning" : "book-hint info"
    klass = names.tr(" ", ".")
    unless title.empty?
      out << "> **#{title}**"
      out << ">"
    end
    body.each { |part| out << "> #{part}" }
    out << "{: .#{klass}}"
  end
  out.join("\n")
end

def convert_embeds(text)
  text.gsub(/!\[\[([^\]|#]+)(?:\|([^\]]*))?\]\]/) do
    name = Regexp.last_match(1).strip
    alt = Regexp.last_match(2).to_s.strip
    alt = File.basename(name, ".*") if alt.empty? || alt.match?(/\A\d+\z/)
    found = find_asset(name)
    next alt unless found

    src = public_asset(found)
    "![#{alt}](#{src})"
  end
end

def convert_links(text, index)
  text.gsub(/\[\[([^\]|#]+)(?:#([^\]|]*))?(?:\|([^\]]*))?\]\]/) do
    page = Regexp.last_match(1).strip
    heading = Regexp.last_match(2).to_s.strip
    alias_text = Regexp.last_match(3)
    label = alias_text.nil? || alias_text.strip.empty? ? (heading.empty? ? page : "#{page} #{heading}") : alias_text.strip
    url = index[page] || index[slugify(page)]
    if url
      fragment = heading.empty? ? "" : "#" + slugify(heading)
      "[#{label}](#{url}#{fragment})"
    else
      label
    end
  end
end

def convert_body(body, index)
  fences = []
  codes = []
  text = protect(body.to_s, /```.*?```/m, fences, "FENCE")
  text = protect(text, /`[^`\n]+`/, codes, "CODE")
  text = convert_callouts(text)
  text = convert_embeds(text)
  text = convert_links(text, index)
  restore(restore(text, codes, "CODE"), fences, "FENCE")
end

def publish_vault(index)
  return [] unless Dir.exist?(VAULT)

  written = []
  Dir[File.join(VAULT, "**", "*.md")].sort.each do |path|
    data, body = split_front(File.read(path, encoding: "UTF-8"))
    next unless truthy(data["share"])

    title = note_title(path, data)
    date = planned_date(path, data)
    slug = planned_slug(data, title)
    data = data.merge(
      "layout" => (data["layout"] || "post").to_s,
      "title" => title,
      "date" => date.strftime("%Y-%m-%d %H:%M:%S %z"),
      "slug" => slug,
      "generated_from" => "obsidian"
    )
    out_name = format("%04d-%02d-%02d-%s.obsidian.md", date.year, date.month, date.day, slug)
    out_path = File.join(POSTS, out_name)
    FileUtils.mkdir_p(POSTS)
    File.write(out_path, dump_post(data, convert_body(body, index)))
    written << out_path
    puts "obsidian: #{path.sub(ROOT + '/', '')} -> _posts/#{out_name}"
  end

  Dir[File.join(POSTS, "*.obsidian.md")].each do |path|
    next if written.include?(path)

    File.delete(path)
    puts "obsidian: removed stale _posts/#{File.basename(path)}"
  end
  written
end

def rewrite_posts(index)
  Dir[File.join(POSTS, "*.md")].sort.each do |path|
    next if path.end_with?(".obsidian.md")

    raw = File.read(path, encoding: "UTF-8")
    next unless raw.include?("[[") || raw.include?("> [!")

    _data, body = split_front(raw)
    converted = convert_body(body, index)
    next if converted == body

    parts = raw.split(/^---\s*$/, 3)
    written = if parts.length >= 3
                "#{parts[0]}---#{parts[1]}---\n\n#{converted.sub(/\A\n+/, '').rstrip}\n"
              else
                "#{converted.sub(/\A\n+/, '').rstrip}\n"
              end
    File.write(path, written)
    puts "obsidian: rewritten _posts/#{File.basename(path)}"
  end
end

index = build_index
publish_vault(index)
rewrite_posts(index)

# frozen_string_literal: true

source "https://rubygems.org"

# 本地和 GitHub Actions 用同一套依赖。
# 线上如果改成「从分支部署」，GitHub Pages 会忽略这个文件，只用它白名单里的插件。
gem "jekyll", "~> 3.10.0"

group :jekyll_plugins do
  gem "jekyll-seo-tag", "~> 2.8"
end

# Ruby 3 不再自带 webrick，本地 `jekyll serve` 需要它。
gem "webrick", "~> 1.8"
gem "kramdown-parser-gfm", "~> 1.1"

# frozen_string_literal: true

source "https://rubygems.org"

# 本地预览和核对构建用。
# 线上由 GitHub Pages 用它自带的 Jekyll 构建，不会读取这个 Gemfile。
# 版本钉在与 GitHub Pages 接近的 3.10，避免本地和线上差一截。
gem "jekyll", "~> 3.10.0"

group :jekyll_plugins do
  gem "jekyll-feed", "~> 0.17"
  gem "jekyll-seo-tag", "~> 2.8"
end

# Ruby 3 不再自带 webrick，`jekyll serve` 需要单独装。
gem "webrick", "~> 1.8"
gem "kramdown-parser-gfm", "~> 1.1"

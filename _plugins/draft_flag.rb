# frozen_string_literal: true

# 前言里 draft: true 的文章不进站点。
# Jekyll 3 在读完文章之后才有前言，posts 也没有 post_read 钩子，
# 所以在全站读完时把这些文章从列表里拿走。

Jekyll::Hooks.register :site, :post_read do |site|
  site.posts.docs.delete_if do |post|
    draft = post.data["draft"]
    draft == true || draft.to_s == "true"
  end
end

## canvas
- viewBox: 0 0 1280 720
- format: PPT 16:9

## mode
- mode: showcase

## visual_style
- visual_style: warm-editorial-light

## colors
- bg: #FAFAF8
- secondary_bg: #F2F0ED
- card_bg: #FFFFFF
- primary: #c9866b
- accent: #b76e4b
- secondary_accent: #d4a574
- text: #2D2A26
- text_secondary: rgba(45, 42, 38, 0.55)
- text_tertiary: rgba(45, 42, 38, 0.30)
- border: rgba(45, 42, 38, 0.08)
- success: #10B981
- warning: #F59E0B
- destructive: #ef4444

## typography
- font_display: "Playfair Display", "Noto Serif SC", Georgia, serif
- font_sans: "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif
- font_mono: Consolas, "Courier New", monospace
- body: 20
- title: 36
- subtitle: 26
- annotation: 15
- cover_title: 64
- hero_number: 48

## icons
- library: tabler-outline
- stroke_width: 2
- inventory: bookmark, bookmarks, link, search, tag, brain, chart-bar, chart-pie, layout-dashboard, timeline, graph, git-compare, puzzle, sparkles, shield-check, key, terminal, settings, users, database, wand, rocket, lock, globe, eye, star, git-fork, share, microphone, headphones, arrow-right, plus, check, chevron-right, external-link, folder, code

## placeholder
- style: dashed-border-card
- border_color: rgba(200, 150, 110, 0.35)
- bg_color: rgba(200, 150, 110, 0.06)
- icon_color: rgba(200, 150, 110, 0.45)
- label_color: rgba(45, 42, 38, 0.20)
- corner_radius: 12

## page_plan
- total_pages: 25
- pages:
  - {num: 1, title: "封面 — MarkBox", rhythm: breathing, layout: single_centered}
  - {num: 2, title: "书签的困境", rhythm: anchor, layout: asymmetric_left_big_right_cards}
  - {num: 3, title: "MarkBox 的答案", rhythm: breathing, layout: centered_flow_3step}
  - {num: 4, title: "技术栈", rhythm: anchor, layout: card_grid_2x2}
  - {num: 5, title: "首页总览", rhythm: anchor, layout: single_image_feature, has_placeholder: full_dashboard}
  - {num: 6, title: "添加书签", rhythm: anchor, layout: flow_left_text_right_image, has_placeholder: detail_url_input}
  - {num: 7, title: "书签管理", rhythm: dense, layout: three_card_row, has_placeholders: [detail_dragdrop, detail_status_badges, detail_context_menu]}
  - {num: 8, title: "富媒体卡片", rhythm: anchor, layout: two_column_image_grid, has_placeholders: [full_grid, detail_media_cards]}
  - {num: 9, title: "AI 能力总览", rhythm: breathing, layout: centered_title_3cards}
  - {num: 10, title: "自动标签", rhythm: anchor, layout: left_text_right_image, has_placeholder: detail_tags}
  - {num: 11, title: "智能分类", rhythm: anchor, layout: left_text_right_image, has_placeholder: detail_category_suggest}
  - {num: 12, title: "AI 摘要", rhythm: anchor, layout: left_text_right_image, has_placeholder: detail_summary}
  - {num: 13, title: "十大视图总览", rhythm: dense, layout: card_grid_3x3_plus1}
  - {num: 14, title: "仪表板统计", rhythm: anchor, layout: image_top_text_bottom, has_placeholder: detail_stats_chart}
  - {num: 15, title: "时间线 & 周报", rhythm: anchor, layout: two_column_split, has_placeholders: [full_timeline, detail_weekly]}
  - {num: 16, title: "知识图谱", rhythm: anchor, layout: large_image_with_callouts, has_placeholders: [full_knowledge_graph, detail_graph_node, detail_graph_timeline]}
  - {num: 17, title: "横向对比", rhythm: anchor, layout: two_column_split, has_placeholders: [full_compare, detail_radar]}
  - {num: 18, title: "学习路径", rhythm: anchor, layout: left_text_right_image, has_placeholder: detail_learning_path}
  - {num: 19, title: "发现页 & 推荐", rhythm: anchor, layout: left_text_right_image, has_placeholder: detail_discover}
  - {num: 20, title: "浏览器扩展", rhythm: anchor, layout: left_text_right_image, has_placeholder: detail_extension_popup}
  - {num: 21, title: "语音搜索", rhythm: anchor, layout: left_text_right_image, has_placeholder: detail_voice}
  - {num: 22, title: "分享与协作", rhythm: anchor, layout: left_text_right_image, has_placeholder: detail_share}
  - {num: 23, title: "认证与安全", rhythm: dense, layout: two_column_split, has_placeholders: [detail_login, detail_api_key]}
  - {num: 24, title: "管理面板", rhythm: anchor, layout: single_image_feature, has_placeholder: full_admin}
  - {num: 25, title: "开始使用 MarkBox", rhythm: breathing, layout: single_centered_cta}

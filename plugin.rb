# name: ads-house-ads
# authors: ProCourse Team
# version: 0.1
# url: https://github.com/procourse/discourse-house-ads.git

register_asset 'stylesheets/ads-category.scss'
register_asset 'stylesheets/community-sidebar.scss'

after_initialize do
  require_dependency 'application_controller'

  Topic.register_custom_field_type('ad_url', :string)
  add_to_class(:topic, :ad_url) { self.custom_fields['ad_url'] }
  add_to_serializer(:topic_view, :ad_url) { object.topic.ad_url }

  Topic.register_custom_field_type('show_images', :boolean)
  add_to_class(:topic, :show_images) { self.custom_fields['show_images'] }
  add_to_serializer(:topic_view, :show_images) { object.topic.show_images }

  TopicList.preloaded_custom_fields << 'show_images' if TopicList.respond_to? :preloaded_custom_fields
  add_to_serializer(:topic_list_item, :show_images) { object.show_images }

  TopicList.preloaded_custom_fields << 'ad_url' if TopicList.respond_to? :preloaded_custom_fields
  add_to_serializer(:topic_list_item, :ad_url) { object.ad_url }

  PostRevisor.track_topic_field(:ad_url)

  PostRevisor.track_topic_field(:show_images)

  PostRevisor.class_eval do
    track_topic_field(:show_images) do |tc, show_images|
      tc.record_change('show_images', tc.topic.custom_fields['show_images'], show_images)
      tc.topic.custom_fields['show_images'] = show_images
    end

    track_topic_field(:ad_url) do |tc, ad_url|
      tc.record_change('ad_url', tc.topic.custom_fields['ad_url'], ad_url)
      tc.topic.custom_fields['ad_url'] = ad_url
    end
  end

  DiscourseEvent.on(:before_create_topic) do |topic, creator|
    topic.custom_fields['ad_url'] = creator.opts['ad_url']
    topic.custom_fields['show_images'] = creator.opts['show_images']
  end

  module ::RStudioAnalytics
    class Engine < ::Rails::Engine
      engine_name 'rstudio_analytics'
      isolate_namespace RStudioAnalytics
    end
  end

  RStudioAnalytics::Engine.routes.draw do
    post 'submit' => 'analytics#submit_analytics'
    post 'submit_click' => 'analytics#submit_click_analytics'
  end

  Discourse::Application.routes.append do
    mount ::RStudioAnalytics::Engine, at: 'rstudio_analytics'
  end

  load File.expand_path('../controllers/rstudio_analytics.rb', __FILE__)
end

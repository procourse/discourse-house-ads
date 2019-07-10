class HouseAdsAnalytics::AnalyticsController < ::ApplicationController
  def submit_analytics
    params.require(:topic_ids)
    topic_ids = params[:topic_ids]
    current_time = Time.new

    for topic_id in topic_ids do
      record = PluginStore.get("house_ads_analytics", "#{current_time.strftime("%Y-%m-%d")}_#{topic_id}")
      if record.nil?
        PluginStore.set("house_ads_analytics", "#{current_time.strftime("%Y-%m-%d")}_#{topic_id}", 1)
      else
        PluginStore.set("house_ads_analytics", "#{current_time.strftime("%Y-%m-%d")}_#{topic_id}", record + 1)
      end
    end

    render json: success_json
  end

  def submit_click_analytics
    if !current_user.nil?
      params.require(:topic_id)
      params.require(:url)

      topic_id = params[:topic_id]
      url = params[:url]
      current_time = Time.new

      record = {
        "topic_id"  => topic_id,
        "date"      => current_time.strftime("%Y-%m-%d"),
        "user_id"   => current_user.id,
        "from_url"  => url
      }

      PluginStore.set("house_ads_click_analytics", "#{current_time.strftime("%Y-%m-%d %H-%M-%S")}_#{topic_id}_#{current_user.id}", record.to_json)
      render json: success_json
    else
      render json: failed_json, status: 403
    end
  end
end

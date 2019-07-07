import { ajax } from "discourse/lib/ajax";
import { withPluginApi } from "discourse/lib/plugin-api";
import Topic from 'discourse/models/topic';

function initWithApi(api){
  let clickFunc = function(obj){
    let from_url = obj && obj.currentTarget && obj.currentTarget.baseURI;
    let topicId = obj && obj.delegateTarget && obj.delegateTarget.dataset && obj.delegateTarget.dataset.topicId || obj && obj.delegateTarget && obj.delegateTarget.attributes && obj.delegateTarget.attributes.topicId && obj.delegateTarget.attributes.topicId.value;

    if (from_url && topicId) {
      ajax({
        url: "/house_ads_analytics/submit_click.json",
        type: "POST",
        data:{
          topic_id: topicId,
          url: from_url
        }
      });
    }
    return;
  }

  api.registerConnectorClass('house-ads-sidebar-outlet', 'house-ads-sidebar', {
    setupComponent(args, component) {
      let globalPromises = [];
    //   Topic List one
      ajax(Discourse.SiteSettings.house_ads_query_path_1).then (function(result){
        let topicListOne = [];
        var usersOne = result.users;

        let topicListFiltered = result.topic_list.topics.filter(function(topic){
            return !topic.closed;
        });

        topicListFiltered.slice(0,Discourse.SiteSettings.house_ads_sidebar_max_topics).forEach(function(topic){
          topic.posters.forEach(function(poster){
            poster.user = $.grep(usersOne, function(e){ return e.id == poster.user_id; })[0];
          });
          topicListOne.push(Topic.create(topic));
        });

          component.set('sidebarTopics1', topicListOne);
          ajax({
            url: "/house_ads_analytics/submit.json",
            type: "POST",
            data:{
              topic_ids: topicListOne.map(a => a.id)
            }
          }).then(() => {
            $(".house-ads-sidebar-wrapper .topicList1 a").on('click', clickFunc);
          });
        },
        function(error){
          console.log("House-Ads-Sidebar-Theme : An error occured while fetching topics ( Error:'" + error.errorThrown+"')");
        }
      );

    //   Topic List two
    ajax(Discourse.SiteSettings.house_ads_query_path_2).then (function(result){
        let topicListTwo = [];
        var usersTwo = result.users;
        let promises = [];

        let topicListFiltered = result.topic_list.topics.filter(function(topic){
            return !topic.closed;
        });

        if (topicListFiltered.length < 3) {
            let moreUrl = result.topic_list.more_topics_url;
            moreUrl = moreUrl.replace("random", "random.json")
            promises.push(ajax(moreUrl).then((result) => {
                let moreTopics = result.topic_list.topics.filter(function(topic){
                    return !topic.closed
                });
                topicListFiltered.push.apply(topicListFiltered, moreTopics);
            }));
        }

        Promise.all(promises).then(() => {
            topicListFiltered.slice(0,Discourse.SiteSettings.house_ads_sidebar_max_topics).forEach(function(topic){
              topic.posters.forEach(function(poster){
                poster.user = $.grep(usersTwo, function(e){ return e.id == poster.user_id; })[0];
              });
              topicListTwo.push(Topic.create(topic));
            });
            component.set('sidebarTopics2', topicListTwo);
            ajax({
              url: "/house_ads_analytics/submit.json",
              type: "POST",
              data:{
                topic_ids: topicListTwo.map(a => a.id)
              }
            }).then(() => {
              $(".house-ads-sidebar-wrapper .topicList2 a").on('click', clickFunc);
            });
        });
        },
        function(error){
          console.log("House-Ads-Sidebar-Theme : An error occured while fetching topics ( Error:'" + error.errorThrown+"')");
        }
      );

    //   Announcements category
      ajax(Discourse.SiteSettings.house_ads_query_path_announcements).then (function(result){
            if(result.topic_list.topics && result.topic_list.topics.length > 0){
                var topics = result.topic_list.topics;

                // Iterate and find an appropriate topic
                for (var i = 0; i < topics.length; i++) {
                    var adTopicTmp = topics[i];

                    if(adTopicTmp && !adTopicTmp.closed){
                        var adTopic = topics[i];
                        break;
                    }
                }

                if(adTopic){
                    var announcementsTopicSlug = adTopic.slug;

                    component.set('announcementsUrl', adTopic.ad_url);
                    component.set('announcementsShowImages', adTopic.show_images);
                    component.set('announcementsTitle', adTopic.title);
                    component.set('announcementTopicId', adTopic.id);

                    ajax('/t/'+announcementsTopicSlug+'.json').then (function(resultPosts){
                            var post = resultPosts.post_stream.posts[0];
                            var postDom = $(post.cooked);

                            if (postDom && component.get('announcementsImgUrl') == null) {
                              var images = postDom.find('img');

                              //Filterout emojis
                              images = images.filter(function(index,url){
                                var sub = "emoji"
                                return !url.src.includes(sub);
                              })
                              //If there is an image set the image
                              if(images.length > 0 ){
                                component.set('announcementsImgUrl', images[0].src);
                                ajax({
                                  url: "/house_ads_analytics/submit.json",
                                  type: "POST",
                                  data:{
                                    topic_ids: [post.id]
                                  }
                                });
                              }
                            }
                            component.set('loopDone', true);
                            Ember.run.scheduleOnce('afterRender', this, function() {
                                $(".house-ads-sidebar-wrapper .sidebar-announcement").on('click', clickFunc);
                            });
                        },
                        function(error){
                          console.log("House-Ads-Sidebar-Theme : An error occured while fetching topics ( Error:'" + error.errorThrown+"')");
                        }
                    );
                }
            }
        },

        function(error){
          console.log("House-Ads-Sidebar-Theme : An error occured while fetching topics ( Error:'" + error.errorThrown+"')");
        }
      );
    }

    });
}


export default {
  name: "init-sidebar",
  initialize() { withPluginApi("0.1", initWithApi); }
}

import Composer from 'discourse/models/composer';

export default {
  name: 'ad-url-edits',
  initialize(container) {
    Composer.serializeOnCreate('ad_url');
    Composer.serializeToTopic('ad_url', 'topic.ad_url');

    Composer.serializeOnCreate('show_images');
    Composer.serializeToTopic('show_images', 'topic.show_images');
  }
}

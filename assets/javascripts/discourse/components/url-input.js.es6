import  Category from "discourse/models/category";
import { default as computed } from "ember-addons/ember-computed-decorators";

export default Ember.Component.extend({
  @computed("model.categoryId")
  showField(){
    const categoryId = this.get("model.categoryId");
    var category = Category.findById(categoryId);

    if (category && category.name.toLowerCase() == Discourse.SiteSettings.house_ads_name.toLowerCase()) {
      return true;
    }
    return false;
  },
});

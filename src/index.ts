import Vue from "vue";
import Vuetify from "vuetify";
import "vuetify/dist/vuetify.min.css";

Vue.use(Vuetify);

import GlideZeit from "./components/GlideZeit.vue";

const v = new Vue({
    el: "#app",
    render: (h) => h(GlideZeit),
});

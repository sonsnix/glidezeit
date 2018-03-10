import * as Plotly from "plotly.js";
import Vue from "vue";
import Vuetify from "vuetify";

Vue.use(Vuetify);

// import "vuetify/dist/vuetify.min.css";

import HelloComponent from "./components/Hello.vue";

const v = new Vue({
    el: "#app",
    template: `
    <div>
        Name: <input v-model="name" type="text">
        <hello-component :name="name" :initialEnthusiasm="5" />
    </div>
    `,
    data: { name: "World" },
    components: {
        HelloComponent,
    },
});

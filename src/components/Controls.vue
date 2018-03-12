<template>
    <v-card>
        <v-card-title primary-title>
            <h3 class="headline mb-0">Settings</h3>
        </v-card-title>
        
        <v-card-text>
            <div>
                <v-text-field  label="Location" v-model="location"/>
                <v-select label="Model" v-model="forecastModel" :items="forecastModels"/>
            </div>
        </v-card-text>

    </v-card>
</template>

<script lang="ts">

import * as Plotly from "plotly.js";
import Vue from "vue";

export default Vue.extend({
    data() {
        return {
            location: "47.412/12.245",
            forecastModel: "ecmwf",
            forecastModels: ["ecmwf", "gfs"]
        }
    },
    methods: {

    },
    computed: {
        
    }
});


</script>

<style>
#skew-chart {
    width:100%;
    height:600px;
}
</style>
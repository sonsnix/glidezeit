<template>
    <v-app>
        <v-toolbar color="indigo" dark fixed app>
            <v-toolbar-side-icon></v-toolbar-side-icon>
            <v-toolbar-title>GlideZeit</v-toolbar-title>
        </v-toolbar>
        
        <v-content>
            <v-container grid-list-md fluid fill-height>
                <v-layout justify-center align-center>
                    <v-flex md8>
                        <v-card>
                            <div id="skew-chart">
                            </div>
                        </v-card>
                    </v-flex>
                    <v-flex md4>
                        <v-card>
                            <v-card-title primary-title>
                                <h3 class="headline mb-0">Settings</h3>
                            </v-card-title>
                            
                            <v-card-text>
                                <div>
                                    <v-text-field  label="fcLocation" v-model="fcLocation"/>
                                    <v-select label="Model" v-model="fcModel" :items="fcModels"/>
                                </div>
                            </v-card-text>

                        </v-card>
                    </v-flex>
                </v-layout>
            </v-container>
        </v-content>

    <v-footer color="indigo" app>
      <span class="white--text">   Markus Sons &copy; 2017</span>
    </v-footer>
    </v-app>
</template>

<script lang="ts">

import Vue from "vue";
import SkewT from "./SkewT.vue";
import Controls from "./Controls.vue";
import * as Plotly from "plotly.js";

export default Vue.extend({
    data() : {constants: any, plotData: Plotly.Data[], fcData: any, fcLocation: string, fcModel: string, fcModels: string[], skew: number, apiURL: string} {
        return {
            constants: {
                pressureLevels: [1000.0, 950.0, 925.0, 900.0, 850.0, 800.0, 700.0, 600.0, 500.0, 400.0, 300.0, 200.0, 150.0]
            },
            plotData: [{x: [0, 1, 2], y: [0, 1, 2], type: 'scatter'}],
            fcData: {temperatures: [], dewPoints: []},
            fcLocation: "47.412/12.245",
            fcModel: "ecmwf",
            fcModels: ["ecmwf", "gfs"],
            skew: 35.0,
            apiURL: "https://node.windy.com/forecast/meteogram",
        }  
    },
    methods: {
        requestForecastData: function() {
            fetch(this.apiURL + "/" + this.fcModel + "/" + this.fcLocation).then(response => {
                this.processForecastData(response.json());
            }) ;
        },

        processForecastData: function(r : any) {
            this.constants.pressureLevels.forEach((v: number, i: number) => {
                this.fcData.temperatures[i] = r["temp-" + v.toString() + "h"] - 273.15;
                this.fcData.dewPoints[i] = r["dewpoint-" + v.toString() + "h"] - 273.15;
            });

            const isotherms = [-100, -80, -60, -40, -20, 0, 20, 40, 60];
            let isothermPlots: any = [];
            isotherms.forEach((isotherm, j) => {
                const isothermPlot: any = [];
                this.constants.pressureLevels.forEach((pl: number, i: number) => {
                    isothermPlot[i] = [isotherm + this.skew * Math.log(this.constants.pressureLevels[0] / pl), pl];
                });
                isothermPlots.push({
                    data: isothermPlot,
                    lineStyle: {color: "#aca"},
                    name: "isotherm" + j,
                    showSymbol: false,
                    type: "line",
                });
            });
        }
    },
    computed: {
    },
    created: function() {
    },
    mounted: function() {
        const target : Plotly.Root = "skew-chart";
        Plotly.plot(target, this.plotData, {}, {displayModeBar: false});
    },
    components: { SkewT, Controls }

});
</script>

<style>
.greeting {
    font-size: 20px;
}
</style>
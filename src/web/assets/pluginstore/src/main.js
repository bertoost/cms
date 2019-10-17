/* global Craft */
/* global Garnish */
/* global $ */

import Vue from 'vue'
import {currency} from './js/filters/currency'
import {escapeHtml, formatDate, formatNumber, t} from './js/filters/craft'
import router from './js/router'
import store from './js/store'
import {mapState} from 'vuex'
import Modal from './js/components/modal/Modal'
import StatusMessage from './js/components/StatusMessage'
import App from './App'
import './js/plugins/shave'
import './js/plugins/craftui'
import './js/plugins/vue-awesome-swiper'

Vue.filter('currency', currency)
Vue.filter('escapeHtml', escapeHtml)
Vue.filter('formatDate', formatDate)
Vue.filter('formatNumber', formatNumber)
Vue.filter('t', t)

Garnish.$doc.ready(function() {
    Craft.initUiElements()

    window.pluginStoreApp = new Vue({
        router,
        store,
        render: h => h(App),

        components: {
            Modal,
            StatusMessage,
            App,
        },

        data() {
            return {
                pageTitle: 'Plugin Store',
                plugin: null,
                pluginId: null,
                modalStep: null,
                pluginStoreDataLoaded: false,
                pluginStoreDataError: false,
                craftIdDataLoaded: false,
                pluginLicenseInfoLoaded: false,
                cartDataLoaded: false,
                showModal: false,
                statusMessage: null,
            }
        },

        computed: {
            ...mapState({
                cart: state => state.cart.cart,
                craftId: state => state.craft.craftId,
            }),
        },

        watch: {
            cart(cart) {
                let totalQty = 0

                if (cart) {
                    totalQty = cart.totalQty
                }

                $('.badge', this.$cartButton).html(totalQty)
            },

            craftId() {
                if (this.craftId) {
                    $('.label', this.$craftId).html(this.craftId.username)

                    this.$craftId.removeClass('hidden')
                    this.$craftIdConnectForm.addClass('hidden')
                    this.$craftIdDisconnectForm.removeClass('hidden')
                } else {
                    this.$craftId.addClass('hidden')
                    this.$craftIdConnectForm.removeClass('hidden')
                    this.$craftIdDisconnectForm.addClass('hidden')
                }
            }
        },

        methods: {
            displayNotice(message) {
                Craft.cp.displayNotice(message)
            },

            displayError(message) {
                Craft.cp.displayError(message)
            },

            showPlugin(plugin) {
                this.plugin = plugin
                this.pluginId = plugin.id
                this.openModal('plugin-details')
            },

            openModal(modalStep) {
                this.modalStep = modalStep

                this.showModal = true
            },

            closeModal() {
                this.showModal = false
            },

            updateCraftId(craftIdJson) {
                const craftId = JSON.parse(craftIdJson);
                this.$store.commit('craft/updateCraftId', craftId)
                this.$store.commit('craft')
                this.$emit('craftIdUpdated')
            },

            /**
             * Initializes components that live outside of the Vue app.
             */
            initializeOuterComponents() {
                // Header Title
                this.$headerTitle = $('#header h1');
                this.$headerTitle.on('click', function() {
                    this.$router.push({path: '/'})
                }.bind(this))

                // Cart button
                this.$cartButton = $('#cart-button')

                this.$cartButton.on('click', function(e) {
                    e.preventDefault()
                    this.openModal('cart')
                }.bind(this))

                this.$cartButton.keydown(function(e) {
                    switch (e.which) {
                        case 13: // Enter
                        case 32: // Space
                            e.preventDefault()
                            this.openModal('cart')
                            break

                    }
                }.bind(this))

                // Plugin Store actions
                this.$pluginStoreActions = $('#pluginstore-actions')
                this.$pluginStoreActionsSpinner = $('#pluginstore-actions-spinner')

                // Craft ID account
                this.$craftId = $('#craftid-account')

                // Connect form
                this.$craftIdConnectForm = $('#craftid-connect-form')

                // Disconnect form
                this.$craftIdDisconnectForm = $('#craftid-disconnect-form')
            },

            loadPluginStoreData() {
                this.$store.dispatch('pluginStore/getCoreData')
                    .then(() => {
                        this.pluginStoreDataLoaded = true
                        this.$emit('dataLoaded')
                    })
                    .catch(() => {
                        this.pluginStoreDataError = true
                        this.statusMessage = this.$options.filters.t('The Plugin Store is not available, please try again later.', 'app')
                    })
            },

            loadCraftData() {
                this.$store.dispatch('craft/getCraftData')
                    .then(() => {
                        this.craftIdDataLoaded = true
                        this.$emit('dataLoaded')

                        // Load cart
                        this.$store.dispatch('cart/getCart')
                            .then(() => {
                                this.cartDataLoaded = true
                                this.$emit('dataLoaded')
                            })
                    })
                    .catch(() => {
                        this.craftIdDataLoaded = true
                    })
            },

            loadPluginLicenseInfo() {
                this.$store.dispatch('craft/getPluginLicenseInfo')
                    .then(() => {
                        this.pluginLicenseInfoLoaded = true
                        this.$emit('dataLoaded')
                    })
            },
        },

        created() {
            // Page Title
            this.pageTitle = this.$options.filters.t("Plugin Store", 'app')

            // Status message
            this.statusMessage = this.$options.filters.t("Loading Plugin Store…", 'app')

            // Initialize outer components
            this.initializeOuterComponents()

            // On data loaded
            this.$on('dataLoaded', function() {
                if (this.pluginStoreDataLoaded && (!this.craftIdDataLoaded || !this.cartDataLoaded || !this.pluginLicenseInfoLoaded)) {
                    this.$pluginStoreActionsSpinner.removeClass('hidden')
                }

                if (this.pluginStoreDataLoaded && this.craftIdDataLoaded && this.cartDataLoaded && this.pluginLicenseInfoLoaded) {
                    // All data loaded
                    this.$pluginStoreActions.removeClass('hidden')
                    this.$pluginStoreActionsSpinner.addClass('hidden')
                    this.$emit('allDataLoaded')
                }
            }.bind(this))

            // Load data
            this.loadPluginStoreData()
            this.loadCraftData()
            this.loadPluginLicenseInfo()
        },
    }).$mount('#app')
})

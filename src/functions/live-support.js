import React from 'react'
import {Helmet} from "react-helmet";
import ShopifyContext from "../context";
import Help from "../help.js";

export default class LiveSupport extends React.Component {

    static displayWidget() {
        let shopify = ShopifyContext.getShared();

        let params =
            `Userback.name = "${shopify.store_properties.shop_owner}";
             Userback.email ="${shopify.store_properties.customer_email}";
             Userback.domain ="${shopify.shop_domain}";
            `;

        let support_tag =
            <Helmet>
                <script async defer src="https://tools.luckyorange.com/core/lo.js?site-id=12571603"></script>
                <script>
                    {`
                        Userback = window.Userback || {};
                        Userback.access_token = '33363|62108|pdXIvophsJoqACgK4MK8CRbK3';
                        
                        ${params}
                    
                        Userback.custom_data = {};
                        Userback.custom_data.name = "${shopify.store_properties.shop_owner}";
                        Userback.custom_data.email =  "${shopify.store_properties.customer_email}";
                        Userback.custom_data.store = "${shopify.shop_domain}";
                                  
                        (function(d) {
                            var s = d.createElement('script');s.async = true;
                            s.src = 'https://static.userback.io/widget/v1.js';
                            (d.head || d.body).appendChild(s);
                        })(document);
                        
                        /* Lucky Orange */
                        window.LOQ = window.LOQ || []
                        window.LOQ.push(['ready', async LO => {
                        await LO.$internal.ready('visitor')
                        LO.visitor.identify("${shopify.shop_domain}", { email: "${shopify.store_properties.customer_email}" })
                        
                        await LO.$internal.ready('privacy')
                        LO.privacy.setConsentStatus(true)
                        }])       
                    `}
                </script>

            </Helmet>
        return (support_tag);
    }
}


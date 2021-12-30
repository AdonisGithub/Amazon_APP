import React from "react";
import CsI18n from "./../../components/csI18n";
import {
    Banner,
    Caption,
    TextStyle,
} from "@shopify/polaris";

import {CsValidation} from '../../components/csValidationForm';
import {DeleteMinor, PlusMinor, AlertMinor} from "@shopify/polaris-icons";

class Constants extends React.Component {

    static friendly_name = <TextStyle><CsI18n>Name</CsI18n><Caption><CsI18n>Give a name that is unique, friendly and easy to remember</CsI18n></Caption></TextStyle>;
    static must_be_unique =  <Banner icon={AlertMinor} status="critical" title={CsI18n.t("Name must be unique")}/>;
    static must_select_condition = <Banner icon={AlertMinor} status="critical" title={CsI18n.t("You have to select at least one condition")}/>;
    // static unexpected_error = <Banner icon="alert" status="critical" title={CsI18n.t("Unexpected Error")}/>;
    static saved_successfully = <Banner status="success" title={CsI18n.t("Configuration saved successfully")}/>;

    static models_saved_successfully = <Banner status="success" title={CsI18n.t("Models saved successfully")}/>;
    static mapping_saved_successfully = <Banner status="success" title={CsI18n.t("Mapping saved successfully")}/>;
    static matching_saved_successfully = <Banner status="success" title={CsI18n.t("Matching groups saved successfully")}/>;
    static metaData_saved_successfully = <Banner status="success" title={CsI18n.t("Meta fields saved successfully")}/>;



    static text_safe_to_delete = CsI18n.t("Safe to delete ?");

    static text_save_product_type = CsI18n.t("I want to sell");
    static text_duplicate_model = CsI18n.t("Duplicate model");
    static validation_name_required = <CsValidation.Item rule="required" title={CsI18n.t("Name is required")}/>;
    static validation_name_max_length = <CsValidation.Item rule="maxLength" title={CsI18n.t("Name can't exceed 32 characters")} />
    static validation_name_pattern = <CsValidation.Item rule="pattern" title={CsI18n.t("Name shouldn't contain accents or special characters")} />

    static validation_weight_pattern = <CsValidation.Item rule="pattern" title={CsI18n.t("Weight must be numeric")}/>;
    static validation_weight_required = <CsValidation.Item rule="required" title={CsI18n.t("Weight can't be empty")}/>;
    static validation_weight_max_length = <CsValidation.Item rule="maxLength" title={CsI18n.t("Weight can't exceed 6 digits")}/>;

    static validation_delay_pattern = <CsValidation.Item rule="pattern" title={CsI18n.t("Delay must contain digits only")}/>;
    static validation_delay_required = <CsValidation.Item rule="required" title={CsI18n.t("Delay can't be empty")}/>;
    static validation_delay_max_length = <CsValidation.Item rule="maxLength" title={CsI18n.t("Delay can't exceed 2 digit")}/>;

    static add_a_rule = CsI18n.t('Add rule');
    static add_first_rule = CsI18n.t('Add your first rule');
    static model_add_first_matching_group = CsI18n.t('Add your first matching group');
    static model_add_first_model = CsI18n.t('Add your first model');
    static model_go_to_matching_groups = CsI18n.t('Go to Matching groups');

    static must_be_selected_marketplace = CsI18n.t('No available marketplaces or marketplaces are not selected in Workflow > Platforms');

    static conditions_conditions = [
        {label: CsI18n.t('All conditions'), value: 'all'},
        {label: CsI18n.t('Any condition'), value: 'any'},
    ];
    static conditions_policies = [
        {label: CsI18n.t('Increase'), value: '+'},
        {label: CsI18n.t('Decrease'), value: '-'},
    ];

    static rules_conditions = [
        {label: '', value: ''},
        {label: CsI18n.t('Collection'), value: 'c'},
        {label: CsI18n.t('Product type'), value: 'p'},
        {label: CsI18n.t('Tag'), value: 't'},
        {label: CsI18n.t('Vendor'), value: 'v'},
        {label: CsI18n.t('Amazon marketplace'), value: 'm'},
    ];

    static rules_conditions_markup = [
        {label: '', value: ''},
        {label: CsI18n.t('Collection'), value: 'c'},
        {label: CsI18n.t('Product type'), value: 'p'},
        {label: CsI18n.t('Tag'), value: 't'},
        {label: CsI18n.t('Vendor'), value: 'v'},
        {label: CsI18n.t('Amazon marketplace'), value: 'm'},
        {label: CsI18n.t('Fulfillment channel'), value: 'mfc'}, //
    ];

    static rules_tax_rate_conditions = [
        {label: '', value: ''},
        {label: CsI18n.t('Shipping area'), value: 'osa'},
        {label: CsI18n.t('Item total amount'), value: 'ita'},
        {label: CsI18n.t('Amazon marketplace'), value: 'm'},
        {label: CsI18n.t('Shopify location'), value: 'sl'},
    ];

    static rules_conditions_for_shipping = [
        {label: '', value: ''},
        {label: CsI18n.t('Collection'), value: 'c'},
        {label: CsI18n.t('Product type'), value: 'p'},
        {label: CsI18n.t('Tag'), value: 't'},
        {label: CsI18n.t('Vendor'), value: 'v'},
        {label: CsI18n.t('Shipping carrier'), value: 'sca'},
        {label: CsI18n.t('Amazon marketplace'), value: 'm'},
    ];

    static rules_conditions_filter = [
        {label: '', value: ''},
        {label: CsI18n.t('Collection'), value: 'c'},
        {label: CsI18n.t('Product type'), value: 'p'},
        {label: CsI18n.t('Tag'), value: 't'},
        {label: CsI18n.t('Variant Option'), value: 'svo'},
        {label: CsI18n.t('Vendor'), value: 'v'},
        {label: CsI18n.t('Weight'), value: 'w'},
        {label: CsI18n.t('Amazon marketplace'), value: 'm'},
    ];

    static UNIT_OF_WEIGHT = [
        {label: "lb", value: "lb"},
        {label: "oz", value: "oz"},
        {label: "kg", value: "kg"},
        {label: "g",  value: "g"},
    ];

    static SHIPPING_AREA = [
        {label: 'Europe', value: 'EU'}, //
        {label: 'Australia', value: 'AU'},
        {label: 'Austria', value: 'AT'},
        {label: 'Belgium', value: 'BE'},
        {label: 'Brazil', value: 'BR'},
        {label: 'Bulgaria', value: 'BG'},
        {label: 'Canada', value: 'CA'},
        {label: 'Croatia', value: 'HR'},
        {label: 'Cyprus', value: 'CY'},
        {label: 'Czech Republic', value: 'CZ'},
        {label: 'Denmark', value: 'DK'},
        {label: 'Egypt', value: 'EG'},
        {label: 'Estonia', value: 'EE'},
        {label: 'Finland', value: 'FI'},
        {label: 'France', value: 'FR'},
        {label: 'Germany', value: 'DE'},
        {label: 'Greece', value: 'GR'},
        {label: 'Hungary', value: 'HU'},
        {label: 'India', value: 'IN'},
        {label: 'Ireland', value: 'IE'},
        {label: 'Italy', value: 'IT'},
        {label: 'Japan', value: 'JP'},
        {label: 'Latvia', value: 'LV'},
        {label: 'Lithuania', value: 'LT'},
        {label: 'Luxembourg', value: 'LU'},
        {label: 'Malta', value: 'MT'},
        {label: 'Mexico', value: 'MX'},
        {label: 'Netherlands', value: 'NL'},
        {label: 'Poland', value: 'PL'},
        {label: 'Portugal', value: 'PT'},
        {label: 'Romania', value: 'RO'},
        {label: 'Saudi Arabia', value: 'SA'},
        {label: 'Singapore', value: 'SG'},
        {label: 'Slovakia', value: 'SK'},
        {label: 'Slovenia', value: 'SI'},
        {label: 'Spain', value: 'ES'},
        {label: 'Sweden', value: 'SE'},
        {label: 'United Arab Emirates (U.A.E.)', value: 'AE'},
        {label: 'United Kingdom', value: 'UK'},
        {label: 'USA', value: 'US'},
    ];

    static RULE_EQUAL = 0;
    static RULE_CONTAINS = 1;
    static RULE_NOT_EQUAL = 10;
    static RULE_NOT_CONTAINS = 11;

    static rules_rules_std = [
        {label: CsI18n.t('is equal to'), value: 0},
        {label: CsI18n.t('contains'), value: 1},
        {label: CsI18n.t('is NOT equal to'), value: 10},
        {label: CsI18n.t('doesn\'t contain'), value: 11}
    ];

    static rules_rules_contains = [
        {label: CsI18n.t('contains'), value: 1},
        {label: CsI18n.t('doesn\'t contain'), value: 11}
    ]

    static rules_rules_only_equal = [
        {label: CsI18n.t('is equal to'), value: 0},
        {label: CsI18n.t('is NOT equal to'), value: 10},
    ];

    static rules_rules_less_greater_equal = [
        {label: CsI18n.t('is equal to'), value: 2},
        {label: CsI18n.t('is less than'), value: 3},
        {label: CsI18n.t('is greater than'), value: 4}
    ];

    static rules_rules_only_less_greater = [
        {label: CsI18n.t('is less than'), value: 3},
        {label: CsI18n.t('is greater than'), value: 4}
    ];

    static rules_rules_only_less_greater_mark = [
        {label: CsI18n.t('is less than(<)'), value: 3},
        {label: CsI18n.t('is equal to or greater than(>=)'), value: 5}
    ];

    static rules_policies = [
        {label: CsI18n.t('Percentage'), value: '%'},
        {label: CsI18n.t('Value'), value: '$'},
    ];

    static rules_policies_v2 = [
        {label: CsI18n.t('Percentage'), value: '%'},
        {label: CsI18n.t('Value'), value: '$'},
        {label: CsI18n.t('Percentage(+)'), value: '%+'},
        {label: CsI18n.t('Value(+)'), value: '$+'},
        {label: CsI18n.t('Percentage(-)'), value: '%-'},
        {label: CsI18n.t('Value(-)'), value: '$-'},
    ];

    static sale_methods = [
        {label: CsI18n.t('Percentage'), value: '%'},
        {label: CsI18n.t('compare at price'), value: '$'},
    ];

    static rounding_modes = [
        {label: CsI18n.t('Smart rounding'), value: 's', helpText: CsI18n.t("It would adjusts 10.53 to 10.59, 10.00 to 9.99"),},
        {label: CsI18n.t('Regular, 2 decimals'), value: 'r'},
        {label: CsI18n.t('None, keep prices "as is"'), value: 'n'},
    ];

    static yes_no = [{value:'yes', label:CsI18n.t('Yes')}, {value:'no', label:CsI18n.t('No')}];

    static order_actions = [
        {label: '', value: ''},
        {label: CsI18n.t('Delivery method(Shopify side)'), value: 'dm'},
        {label: CsI18n.t('Tag'), value: 't'},
        {label: CsI18n.t('Mark as fulfilled'), value: 'f'},
        {label: CsI18n.t('Mark as unfulfilled'), value: 'uf'},
        {label: CsI18n.t("Don't put the default tag"), value: "dont-put-tag"},
        // {label: CsI18n.t('Prefix'), value: 'p'},
    ];

    static shipping_actions = [
        {label: '', value: ''},
        {label: CsI18n.t('Apply Shipping-Template (Shipping group)'), value: 'g'},
        {label: CsI18n.t('Apply Carrier for Amazon'), value: 'ac'},
        {label: CsI18n.t('Apply Delivery Service/Ship-Method'), value: 'sm'},
        {label: CsI18n.t('Add delay (handling time)'), value: 'd'},
        {label: CsI18n.t('Add weight'), value: 'w'},
        {label: CsI18n.t('Apply speed category for MCF (FBA)'), value: 's'},
    ];

    static product_properties = [
        {label: '', value: ''},
        {label: CsI18n.t('Condition'), value: 'cond'},
        {label: CsI18n.t('Condition note'), value: 'note'},
        {label: CsI18n.t('Gift wrap available'), value: 'gift_wrap'},
        {label: CsI18n.t('Country of origin'), value: 'country_of_origin'},
        {label: CsI18n.t('SKU'), value: 'sku'},
        {label: CsI18n.t('Barcode'), value: 'barcode'},
    ];

    static amazon_product_conditions = [
        {label: '', value: ''},
        {label: CsI18n.t('New'), value: 'New'},
        {label: CsI18n.t('Used - Like New'), value: 'UsedLikeNew'},
        {label: CsI18n.t('Used - Very Good'), value: 'UsedVeryGood'},
        {label: CsI18n.t('Used - Good'), value: 'UsedGood'},
        {label: CsI18n.t('Used - Acceptable'), value: 'UsedAcceptable'},
        {label: CsI18n.t('Collectible - Like New'), value: 'CollectibleLikeNew'},
        {label: CsI18n.t('Collectible - Very Good'), value: 'CollectibleVeryGood'},
        {label: CsI18n.t('Collectible - Good'), value: 'CollectibleGood'},
        {label: CsI18n.t('Collectible - Acceptable'), value: 'CollectibleAcceptable'},
        {label: CsI18n.t('Club'), value: 'Club'},
    ]

    static gift_wrap_values = [
        {label: '', value: ''},
        {label: CsI18n.t('True'), value: 'true'},
        {label: CsI18n.t('False'), value: 'false'},
    ];

    static fulfillment_modes = [
        {label: "Merchant Fulfilment Network", value: "MFN"},
        {label: "Amazon Fulfilment Network", value: "AFN"}
    ];


    static order_condition_mapping = {
        AFN: 'Amazon',
        MFN: CsI18n.t('Merchant'),
        StandardOrder: CsI18n.t('Standard'),
        Preorder: CsI18n.t('Pre-order'),
    }

    static simulator_markups = [
        "Markup", "From", "To", "Example", "Sale price", "Price"
    ]

    static simulator_filters = [
        "Example", "Action"
    ]

    static simulator_inventory = [
        "Example", "Action", "Quantity"
    ]

    /*
       Regex to generate the object:
        US - Search: (.*File)\.(.*).xlsm$ Replace by: \L\2\E: '\1.\2.xlsm',
        INTL - Search: (.*File)\.(.*)\.([a-z]*).xlsm$ Replace by: \L\2\E: '\1.\2.\3.xlsm',
     */
    static xls_templates_mapping = {
        us:
            {
                autoaccessory: 'https://s3.amazonaws.com/category-custom-templates/ff/na/us/Flat.File.AutoAccessory.xlsm',
                tiresandwheels: 'https://s3.amazonaws.com/category-custom-templates/ff/na/us/Flat.File.TiresAndWheels.xlsm',
                baby: 'https://s3.amazonaws.com/category-custom-templates/ff/na/us/Flat.File.Baby.xlsm',
                beauty: 'https://s3.amazonaws.com/category-custom-templates/ff/na/us/Flat.File.Beauty.xlsm',
                bookloader: 'https://s3.amazonaws.com/category-custom-templates/ff/na/us/Flat.File.BookLoader.xlsm',
                cameraandphoto: 'https://s3.amazonaws.com/category-custom-templates/ff/na/us/Flat.File.CameraAndPhoto.xlsm',
                wireless: 'https://s3.amazonaws.com/category-custom-templates/ff/na/us/Flat.File.Wireless.xlsm',
                clothing: 'https://s3.amazonaws.com/category-custom-templates/ff/na/us/Flat.File.Clothing.xlsm',
                coins: 'https://s3.amazonaws.com/category-custom-templates/ff/na/us/Flat.File.Coins.xlsm',
                computers: 'https://s3.amazonaws.com/category-custom-templates/ff/na/us/Flat.File.Computers.xlsm',
                consumerelectronics: 'https://s3.amazonaws.com/category-custom-templates/ff/na/us/Flat.File.ConsumerElectronics.xlsm',
                entertainmentcollectibles: 'https://s3.amazonaws.com/category-custom-templates/ff/na/us/Flat.File.EntertainmentCollectibles.xlsm',
                home: 'https://s3.amazonaws.com/category-custom-templates/ff/na/us/Flat.File.Home.xlsm',
                giftcards: 'https://s3.amazonaws.com/category-custom-templates/ff/na/us/Flat.File.GiftCards.xlsm',
                foodandbeverages: 'https://s3.amazonaws.com/category-custom-templates/ff/na/us/Flat.File.FoodAndBeverages.xlsm',
                health: 'https://s3.amazonaws.com/category-custom-templates/ff/na/us/Flat.File.Health.xlsm',
                mechanicalfasteners: 'https://s3.amazonaws.com/category-custom-templates/ff/na/us/Flat.File.MechanicalFasteners.xlsm',
                labsupplies: 'https://s3.amazonaws.com/category-custom-templates/ff/na/us/Flat.File.LabSupplies.xlsm',
                powertransmission: 'https://s3.amazonaws.com/category-custom-templates/ff/na/us/Flat.File.PowerTransmission.xlsm',
                industrial: 'https://s3.amazonaws.com/category-custom-templates/ff/na/us/Flat.File.Industrial.xlsm',
                jewelry: 'https://s3.amazonaws.com/category-custom-templates/ff/na/us/Flat.File.Jewelry.xlsm',
                lighting: 'https://s3.amazonaws.com/category-custom-templates/ff/na/us/Flat.File.Lighting.xlsm',
                music: 'https://s3.amazonaws.com/category-custom-templates/ff/na/us/Flat.File.Music.xlsm',
                musicalinstruments: 'https://s3.amazonaws.com/category-custom-templates/ff/na/us/Flat.File.MusicalInstruments.xlsm',
                office: 'https://s3.amazonaws.com/category-custom-templates/ff/na/us/Flat.File.Office.xlsm',
                outdoors: 'https://s3.amazonaws.com/category-custom-templates/ff/na/us/Flat.File.Outdoors.xlsm',
                petsupplies: 'https://s3.amazonaws.com/category-custom-templates/ff/na/us/Flat.File.PetSupplies.xlsm',
                shoes: 'https://s3.amazonaws.com/category-custom-templates/ff/na/us/Flat.File.Shoes.xlsm',
                softwarevideogames: 'https://s3.amazonaws.com/category-custom-templates/ff/na/us/Flat.File.SoftwareVideoGames.xlsm',
                sports: 'https://s3.amazonaws.com/category-custom-templates/ff/na/us/Flat.File.Sports.xlsm',
                sportsmemorabilia: 'https://s3.amazonaws.com/category-custom-templates/ff/na/us/Flat.File.SportsMemorabilia.xlsm',
                tradingcards: 'https://s3.amazonaws.com/category-custom-templates/ff/na/us/Flat.File.TradingCards.xlsm',
                homeimprovement: 'https://s3.amazonaws.com/category-custom-templates/ff/na/us/Flat.File.HomeImprovement.xlsm',
                toys: 'https://s3.amazonaws.com/category-custom-templates/ff/na/us/Flat.File.Toys.xlsm',
                video: 'https://s3.amazonaws.com/category-custom-templates/ff/na/us/Flat.File.Video.xlsm',
                watches: 'https://s3.amazonaws.com/category-custom-templates/ff/na/us/Flat.File.Watches.xlsm',
            },
        ae: {
            bookloader: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/ae/Flat.File.BookLoader.ae.xlsm',
            music: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/ae/Flat.File.Music.ae.xlsm',
            kindleaccessories: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/ae/Flat.File.KindleAccessories.ae.xlsm',
            petsupplies: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/ae/Flat.File.PetSupplies.ae.xlsm',
            autoaccessory: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/ae/Flat.File.AutoAccessory.ae.xlsm',
            tiresandwheels: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/ae/Flat.File.TiresAndWheels.ae.xlsm',
            motoapparel: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/ae/Flat.File.MotoApparel.ae.xlsm',
            luggage: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/ae/Flat.File.Luggage.ae.xlsm',
            toysbaby: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/ae/Flat.File.ToysBaby.ae.xlsm',
            professionalhealthcare: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/ae/Flat.File.ProfessionalHealthCare.ae.xlsm',
            labsupplies: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/ae/Flat.File.LabSupplies.ae.xlsm',
            industrial: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/ae/Flat.File.Industrial.ae.xlsm',
            educationalsupplies: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/ae/Flat.File.EducationalSupplies.ae.xlsm',
            foodserviceandjansan: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/ae/Flat.File.FoodServiceAndJanSan.ae.xlsm',
            jewelry: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/ae/Flat.File.Jewelry.ae.xlsm',
            homeimprovement: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/ae/Flat.File.HomeImprovement.ae.xlsm',
            shoes: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/ae/Flat.File.Shoes.ae.xlsm',
            office: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/ae/Flat.File.Office.ae.xlsm',
            largeappliances: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/ae/Flat.File.LargeAppliances.ae.xlsm',
            consumerelectronics: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/ae/Flat.File.ConsumerElectronics.ae.xlsm',
            computers: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/ae/Flat.File.Computers.ae.xlsm',
            musicalinstruments: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/ae/Flat.File.MusicalInstruments.ae.xlsm',
            lawnandgarden: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/ae/Flat.File.LawnAndGarden.ae.xlsm',
            softwarevideogames: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/ae/Flat.File.SoftwareVideoGames.ae.xlsm',
            lighting: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/ae/Flat.File.Lighting.ae.xlsm',
            eyewear: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/ae/Flat.File.Eyewear.ae.xlsm',
            home: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/ae/Flat.File.Home.ae.xlsm',
            watches: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/ae/Flat.File.Watches.ae.xlsm',
            kitchen: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/ae/Flat.File.Kitchen.ae.xlsm',
            sports: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/ae/Flat.File.Sports.ae.xlsm',
            clothing: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/ae/Flat.File.Clothing.ae.xlsm',
        },
        au:
            {
                consumerelectronics: 'https://s3.amazonaws.com/category-custom-templates/ff/au/Flat.File.ConsumerElectronics.au.xlsm',
                cameraandphoto: 'https://s3.amazonaws.com/category-custom-templates/ff/au/Flat.File.CameraAndPhoto.au.xlsm',
                home: 'https://s3.amazonaws.com/category-custom-templates/ff/au/Flat.File.Home.au.xlsm',
                softwarevideogames: 'https://s3.amazonaws.com/category-custom-templates/ff/au/Flat.File.SoftwareVideoGames.au.xlsm',
                toys: 'https://s3.amazonaws.com/category-custom-templates/ff/au/Flat.File.Toys.au.xlsm',
                sports: 'https://s3.amazonaws.com/category-custom-templates/ff/au/Flat.File.Sports.au.xlsm',
                health: 'https://s3.amazonaws.com/category-custom-templates/ff/au/Flat.File.Health.au.xlsm',
                foodandbeverages: 'https://s3.amazonaws.com/category-custom-templates/ff/au/Flat.File.FoodAndBeverages.au.xlsm',
                watches: 'https://s3.amazonaws.com/category-custom-templates/ff/au/Flat.File.Watches.au.xlsm',
                clothing: 'https://s3.amazonaws.com/category-custom-templates/ff/au/Flat.File.Clothing.au.xlsm',
                beauty: 'https://s3.amazonaws.com/category-custom-templates/ff/au/Flat.File.Beauty.au.xlsm',
                jewelry: 'https://s3.amazonaws.com/category-custom-templates/ff/au/Flat.File.Jewelry.au.xlsm',
                computers: 'https://s3.amazonaws.com/category-custom-templates/ff/au/Flat.File.Computers.au.xlsm',
                office: 'https://s3.amazonaws.com/category-custom-templates/ff/au/Flat.File.Office.au.xlsm',
                homeimprovement: 'https://s3.amazonaws.com/category-custom-templates/ff/au/Flat.File.HomeImprovement.au.xlsm',
                autoaccessory: 'https://s3.amazonaws.com/category-custom-templates/ff/au/Flat.File.AutoAccessory.au.xlsm',
                musicalinstruments: 'https://s3.amazonaws.com/category-custom-templates/ff/au/Flat.File.MusicalInstruments.au.xlsm',
                petsupplies: 'https://s3.amazonaws.com/category-custom-templates/ff/au/Flat.File.PetSupplies.au.xlsm',
                music: 'https://s3.amazonaws.com/category-custom-templates/ff/au/Flat.File.Music.au.xlsm',
                video: 'https://s3.amazonaws.com/category-custom-templates/ff/au/Flat.File.Video.au.xlsm',
                bookloader: 'https://s3.amazonaws.com/category-custom-templates/ff/au/Flat.File.BookLoader.au.xlsm',
                shoes: 'https://s3.amazonaws.com/category-custom-templates/ff/au/Flat.File.Shoes.au.xlsm',
                baby: 'https://s3.amazonaws.com/category-custom-templates/ff/au/Flat.File.Baby.au.xlsm',
                wireless: 'https://s3.amazonaws.com/category-custom-templates/ff/au/Flat.File.Wireless.au.xlsm',
                giftcards: 'https://s3.amazonaws.com/category-custom-templates/ff/au/Flat.File.GiftCards.au.xlsm',
                industrial: 'https://s3.amazonaws.com/category-custom-templates/ff/au/Flat.File.Industrial.au.xlsm',
                labsupplies: 'https://s3.amazonaws.com/category-custom-templates/ff/au/Flat.File.LabSupplies.au.xlsm',
                lighting: 'https://s3.amazonaws.com/category-custom-templates/ff/au/Flat.File.Lighting.au.xlsm',
                mechanicalfasteners: 'https://s3.amazonaws.com/category-custom-templates/ff/au/Flat.File.MechanicalFasteners.au.xlsm',
                outdoors: 'https://s3.amazonaws.com/category-custom-templates/ff/au/Flat.File.Outdoors.au.xlsm',
                tiresandwheels: 'https://s3.amazonaws.com/category-custom-templates/ff/au/Flat.File.TiresAndWheels.au.xlsm',
            },
        br:
            {
                clothing: 'https://s3.amazonaws.com/category-custom-templates/ff/na/br/Flat.File.Clothing.br.xlsm',
                bookloader: 'https://s3.amazonaws.com/category-custom-templates/ff/na/br/Flat.File.BookLoader.br.xlsm',
                cameraandphoto: 'https://s3.amazonaws.com/category-custom-templates/ff/na/br/Flat.File.CameraAndPhoto.br.xlsm',
                computers: 'https://s3.amazonaws.com/category-custom-templates/ff/na/br/Flat.File.Computers.br.xlsm',
                consumerelectronics: 'https://s3.amazonaws.com/category-custom-templates/ff/na/br/Flat.File.ConsumerElectronics.br.xlsm',
                lighting: 'https://s3.amazonaws.com/category-custom-templates/ff/na/br/Flat.File.Lighting.br.xlsm',
                homeimprovement: 'https://s3.amazonaws.com/category-custom-templates/ff/na/br/Flat.File.HomeImprovement.br.xlsm',
                office: 'https://s3.amazonaws.com/category-custom-templates/ff/na/br/Flat.File.Office.br.xlsm',
                sports: 'https://s3.amazonaws.com/category-custom-templates/ff/na/br/Flat.File.Sports.br.xlsm',
                softwarevideogames: 'https://s3.amazonaws.com/category-custom-templates/ff/na/br/Flat.File.SoftwareVideoGames.br.xlsm',
                wireless: 'https://s3.amazonaws.com/category-custom-templates/ff/na/br/Flat.File.Wireless.br.xlsm',
            },
        ca:
            {
                autoaccessory: 'https://s3.amazonaws.com/category-custom-templates/ff/na/ca/Flat.File.AutoAccessory.ca.xlsm',
                tiresandwheels: 'https://s3.amazonaws.com/category-custom-templates/ff/na/ca/Flat.File.TiresAndWheels.ca.xlsm',
                baby: 'https://s3.amazonaws.com/category-custom-templates/ff/na/ca/Flat.File.Baby.ca.xlsm',
                beauty: 'https://s3.amazonaws.com/category-custom-templates/ff/na/ca/Flat.File.Beauty.ca.xlsm',
                bookloader: 'https://s3.amazonaws.com/category-custom-templates/ff/na/ca/Flat.File.BookLoader.ca.xlsm',
                cameraandphoto: 'https://s3.amazonaws.com/category-custom-templates/ff/na/ca/Flat.File.CameraAndPhoto.ca.xlsm',
                wireless: 'https://s3.amazonaws.com/category-custom-templates/ff/na/ca/Flat.File.Wireless.ca.xlsm',
                clothing: 'https://s3.amazonaws.com/category-custom-templates/ff/na/ca/Flat.File.Clothing.ca.xlsm',
                coins: 'https://s3.amazonaws.com/category-custom-templates/ff/na/ca/Flat.File.Coins.ca.xlsm',
                computers: 'https://s3.amazonaws.com/category-custom-templates/ff/na/ca/Flat.File.Computers.ca.xlsm',
                consumerelectronics: 'https://s3.amazonaws.com/category-custom-templates/ff/na/ca/Flat.File.ConsumerElectronics.ca.xlsm',
                entertainmentcollectibles: 'https://s3.amazonaws.com/category-custom-templates/ff/na/ca/Flat.File.EntertainmentCollectibles.ca.xlsm',
                giftcards: 'https://s3.amazonaws.com/category-custom-templates/ff/na/ca/Flat.File.GiftCards.ca.xlsm',
                foodandbeverages: 'https://s3.amazonaws.com/category-custom-templates/ff/na/ca/Flat.File.FoodAndBeverages.ca.xlsm',
                health: 'https://s3.amazonaws.com/category-custom-templates/ff/na/ca/Flat.File.Health.ca.xlsm',
                home: 'https://s3.amazonaws.com/category-custom-templates/ff/na/ca/Flat.File.Home.ca.xlsm',
                mechanicalfasteners: 'https://s3.amazonaws.com/category-custom-templates/ff/na/ca/Flat.File.MechanicalFasteners.ca.xlsm',
                labsupplies: 'https://s3.amazonaws.com/category-custom-templates/ff/na/ca/Flat.File.LabSupplies.ca.xlsm',
                powertransmission: 'https://s3.amazonaws.com/category-custom-templates/ff/na/ca/Flat.File.PowerTransmission.ca.xlsm',
                industrial: 'https://s3.amazonaws.com/category-custom-templates/ff/na/ca/Flat.File.Industrial.ca.xlsm',
                jewelry: 'https://s3.amazonaws.com/category-custom-templates/ff/na/ca/Flat.File.Jewelry.ca.xlsm',
                lighting: 'https://s3.amazonaws.com/category-custom-templates/ff/na/ca/Flat.File.Lighting.ca.xlsm',
                music: 'https://s3.amazonaws.com/category-custom-templates/ff/na/ca/Flat.File.Music.ca.xlsm',
                musicalinstruments: 'https://s3.amazonaws.com/category-custom-templates/ff/na/ca/Flat.File.MusicalInstruments.ca.xlsm',
                office: 'https://s3.amazonaws.com/category-custom-templates/ff/na/ca/Flat.File.Office.ca.xlsm',
                outdoors: 'https://s3.amazonaws.com/category-custom-templates/ff/na/ca/Flat.File.Outdoors.ca.xlsm',
                petsupplies: 'https://s3.amazonaws.com/category-custom-templates/ff/na/ca/Flat.File.PetSupplies.ca.xlsm',
                shoes: 'https://s3.amazonaws.com/category-custom-templates/ff/na/ca/Flat.File.Shoes.ca.xlsm',
                softwarevideogames: 'https://s3.amazonaws.com/category-custom-templates/ff/na/ca/Flat.File.SoftwareVideoGames.ca.xlsm',
                sports: 'https://s3.amazonaws.com/category-custom-templates/ff/na/ca/Flat.File.Sports.ca.xlsm',
                sportsmemorabilia: 'https://s3.amazonaws.com/category-custom-templates/ff/na/ca/Flat.File.SportsMemorabilia.ca.xlsm',
                tradingcards: 'https://s3.amazonaws.com/category-custom-templates/ff/na/ca/Flat.File.TradingCards.ca.xlsm',
                homeimprovement: 'https://s3.amazonaws.com/category-custom-templates/ff/na/ca/Flat.File.HomeImprovement.ca.xlsm',
                toys: 'https://s3.amazonaws.com/category-custom-templates/ff/na/ca/Flat.File.Toys.ca.xlsm',
                video: 'https://s3.amazonaws.com/category-custom-templates/ff/na/ca/Flat.File.Video.ca.xlsm',
                watches: 'https://s3.amazonaws.com/category-custom-templates/ff/na/ca/Flat.File.Watches.ca.xlsm',
            },
        de:
            {
                autoaccessory: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/de/Flat.File.AutoAccessory.de.xlsm',
                tiresandwheels: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/de/Flat.File.TiresAndWheels.de.xlsm',
                motoapparel: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/de/Flat.File.MotoApparel.de.xlsm',
                motorcycles: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/de/Flat.File.Motorcycles.de.xlsm',
                professionalhealthcare: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/de/Flat.File.ProfessionalHealthCare.de.xlsm',
                labsupplies: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/de/Flat.File.LabSupplies.de.xlsm',
                industrial: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/de/Flat.File.Industrial.de.xlsm',
                educationalsupplies: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/de/Flat.File.EducationalSupplies.de.xlsm',
                foodserviceandjansan: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/de/Flat.File.FoodServiceAndJanSan.de.xlsm',
                homeimprovement: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/de/Flat.File.HomeImprovement.de.xlsm',
                home: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/de/Flat.File.Home.de.xlsm',
                beauty: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/de/Flat.File.Beauty.de.xlsm',
                clothing: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/de/Flat.File.Clothing.de.xlsm',
                eyewear: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/de/Flat.File.Eyewear.de.xlsm',
                bookloader: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/de/Flat.File.BookLoader.de.xlsm',
                office: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/de/Flat.File.Office.de.xlsm',
                computers: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/de/Flat.File.Computers.de.xlsm',
                health: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/de/Flat.File.Health.de.xlsm',
                consumerelectronics: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/de/Flat.File.ConsumerElectronics.de.xlsm',
                largeappliances: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/de/Flat.File.LargeAppliances.de.xlsm',
                lawnandgarden: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/de/Flat.File.LawnAndGarden.de.xlsm',
                petsupplies: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/de/Flat.File.PetSupplies.de.xlsm',
                kindleaccessories: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/de/Flat.File.KindleAccessories.de.xlsm',
                luggage: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/de/Flat.File.Luggage.de.xlsm',
                kitchen: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/de/Flat.File.Kitchen.de.xlsm',
                foodandbeverages: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/de/Flat.File.FoodAndBeverages.de.xlsm',
                music: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/de/Flat.File.Music.de.xlsm',
                musicalinstruments: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/de/Flat.File.MusicalInstruments.de.xlsm',
                jewelry: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/de/Flat.File.Jewelry.de.xlsm',
                shoes: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/de/Flat.File.Shoes.de.xlsm',
                toysbaby: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/de/Flat.File.ToysBaby.de.xlsm',
                sports: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/de/Flat.File.Sports.de.xlsm',
                video: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/de/Flat.File.Video.de.xlsm',
                softwarevideogames: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/de/Flat.File.SoftwareVideoGames.de.xlsm',
                watches: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/de/Flat.File.Watches.de.xlsm',
            },
        es:
            {
                music: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/es/Flat.File.Music.es.xlsm',
                video: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/es/Flat.File.Video.es.xlsm',
                autoaccessory: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/es/Flat.File.AutoAccessory.es.xlsm',
                tiresandwheels: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/es/Flat.File.TiresAndWheels.es.xlsm',
                motoapparel: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/es/Flat.File.MotoApparel.es.xlsm',
                clothing: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/es/Flat.File.Clothing.es.xlsm',
                jewelry: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/es/Flat.File.Jewelry.es.xlsm',
                luggage: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/es/Flat.File.Luggage.es.xlsm',
                shoes: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/es/Flat.File.Shoes.es.xlsm',
                watches: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/es/Flat.File.Watches.es.xlsm',
                baby: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/es/Flat.File.Baby.es.xlsm',
                bookloader: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/es/Flat.File.BookLoader.es.xlsm',
                computers: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/es/Flat.File.Computers.es.xlsm',
                consumerelectronics: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/es/Flat.File.ConsumerElectronics.es.xlsm',
                health: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/es/Flat.File.Health.es.xlsm',
                petsupplies: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/es/Flat.File.PetSupplies.es.xlsm',
                home: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/es/Flat.File.Home.es.xlsm',
                kitchen: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/es/Flat.File.Kitchen.es.xlsm',
                lighting: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/es/Flat.File.Lighting.es.xlsm',
                softwarevideogames: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/es/Flat.File.SoftwareVideoGames.es.xlsm',
                sports: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/es/Flat.File.Sports.es.xlsm',
                tools: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/es/Flat.File.Tools.es.xlsm',
                toys: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/es/Flat.File.Toys.es.xlsm',
                kindleaccessories: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/es/Flat.File.KindleAccessories.es.xlsm',
                office: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/es/Flat.File.Office.es.xlsm',
                musicalinstruments: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/es/Flat.File.MusicalInstruments.es.xlsm',
                lawnandgarden: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/es/Flat.File.LawnAndGarden.es.xlsm',
                eyewear: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/es/Flat.File.Eyewear.es.xlsm',
                beauty: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/es/Flat.File.Beauty.es.xlsm',
                foodandbeverages: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/es/Flat.File.FoodAndBeverages.es.xlsm',
                professionalhealthcare: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/es/Flat.File.ProfessionalHealthCare.es.xlsm',
                labsupplies: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/es/Flat.File.LabSupplies.es.xlsm',
                industrial: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/es/Flat.File.Industrial.es.xlsm',
                educationalsupplies: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/es/Flat.File.EducationalSupplies.es.xlsm',
                foodserviceandjansan: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/es/Flat.File.FoodServiceAndJanSan.es.xlsm',
            },
        fr:
            {
                bookloader: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/fr/Flat.File.BookLoader.fr.xlsm',
                music: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/fr/Flat.File.Music.fr.xlsm',
                video: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/fr/Flat.File.Video.fr.xlsm',
                kindleaccessories: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/fr/Flat.File.KindleAccessories.fr.xlsm',
                petsupplies: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/fr/Flat.File.PetSupplies.fr.xlsm',
                autoaccessory: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/fr/Flat.File.AutoAccessory.fr.xlsm',
                tiresandwheels: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/fr/Flat.File.TiresAndWheels.fr.xlsm',
                motoapparel: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/fr/Flat.File.MotoApparel.fr.xlsm',
                luggage: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/fr/Flat.File.Luggage.fr.xlsm',
                toysbaby: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/fr/Flat.File.ToysBaby.fr.xlsm',
                professionalhealthcare: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/fr/Flat.File.ProfessionalHealthCare.fr.xlsm',
                labsupplies: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/fr/Flat.File.LabSupplies.fr.xlsm',
                industrial: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/fr/Flat.File.Industrial.fr.xlsm',
                educationalsupplies: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/fr/Flat.File.EducationalSupplies.fr.xlsm',
                foodserviceandjansan: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/fr/Flat.File.FoodServiceAndJanSan.fr.xlsm',
                jewelry: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/fr/Flat.File.Jewelry.fr.xlsm',
                homeimprovement: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/fr/Flat.File.HomeImprovement.fr.xlsm',
                shoes: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/fr/Flat.File.Shoes.fr.xlsm',
                office: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/fr/Flat.File.Office.fr.xlsm',
                largeappliances: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/fr/Flat.File.LargeAppliances.fr.xlsm',
                consumerelectronics: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/fr/Flat.File.ConsumerElectronics.fr.xlsm',
                computers: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/fr/Flat.File.Computers.fr.xlsm',
                musicalinstruments: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/fr/Flat.File.MusicalInstruments.fr.xlsm',
                lawnandgarden: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/fr/Flat.File.LawnAndGarden.fr.xlsm',
                softwarevideogames: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/fr/Flat.File.SoftwareVideoGames.fr.xlsm',
                lighting: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/fr/Flat.File.Lighting.fr.xlsm',
                eyewear: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/fr/Flat.File.Eyewear.fr.xlsm',
                home: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/fr/Flat.File.Home.fr.xlsm',
                watches: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/fr/Flat.File.Watches.fr.xlsm',
                kitchen: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/fr/Flat.File.Kitchen.fr.xlsm',
                sports: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/fr/Flat.File.Sports.fr.xlsm',
                clothing: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/fr/Flat.File.Clothing.fr.xlsm',
            },
        in:
            {
                clothing: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/in/Flat.File.Clothing.in.xlsm',
                jewelry: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/in/Flat.File.Jewelry.in.xlsm',
                shoes: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/in/Flat.File.Shoes.in.xlsm',
                luggage: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/in/Flat.File.Luggage.in.xlsm',
                watches: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/in/Flat.File.Watches.in.xlsm',
                computers: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/in/Flat.File.Computers.in.xlsm',
                consumerelectronics: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/in/Flat.File.ConsumerElectronics.in.xlsm',
                musicalinstruments: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/in/Flat.File.MusicalInstruments.in.xlsm',
                office: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/in/Flat.File.Office.in.xlsm',
                health: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/in/Flat.File.Health.in.xlsm',
                toys: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/in/Flat.File.Toys.in.xlsm',
                baby: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/in/Flat.File.Baby.in.xlsm',
                foodandbeverages: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/in/Flat.File.FoodAndBeverages.in.xlsm',
                beauty: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/in/Flat.File.Beauty.in.xlsm',
                petsupplies: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/in/Flat.File.PetSupplies.in.xlsm',
                sports: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/in/Flat.File.Sports.in.xlsm',
                homeimprovement: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/in/Flat.File.HomeImprovement.in.xlsm',
                home: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/in/Flat.File.Home.in.xlsm',
                foodserviceandjansan: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/in/Flat.File.FoodServiceAndJanSan.in.xlsm',
                industrial: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/in/Flat.File.Industrial.in.xlsm',
                labsupplies: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/in/Flat.File.LabSupplies.in.xlsm',
                mechanicalfasteners: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/in/Flat.File.MechanicalFasteners.in.xlsm',
                professionalhealthcare: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/in/Flat.File.ProfessionalHealthCare.in.xlsm',
                lawnandgarden: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/in/Flat.File.LawnAndGarden.in.xlsm',
                autoaccessory: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/in/Flat.File.AutoAccessory.in.xlsm',
                largeappliances: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/in/Flat.File.LargeAppliances.in.xlsm',
                softwarevideogames: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/in/Flat.File.SoftwareVideoGames.in.xlsm',
                bookloader: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/in/Flat.File.BookLoader.in.xlsm',
                video: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/in/Flat.File.Video.in.xlsm',
                giftcards: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/in/Flat.File.GiftCards.in.xlsm',
                music: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/in/Flat.File.Music.in.xlsm',
            },
        it:
            {
                bookloader: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/it/Flat.File.BookLoader.it.xlsm',
                music: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/it/Flat.File.Music.it.xlsm',
                video: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/it/Flat.File.Video.it.xlsm',
                kindleaccessories: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/it/Flat.File.KindleAccessories.it.xlsm',
                autoaccessory: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/it/Flat.File.AutoAccessory.it.xlsm',
                tiresandwheels: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/it/Flat.File.TiresAndWheels.it.xlsm',
                motoapparel: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/it/Flat.File.MotoApparel.it.xlsm',
                baby: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/it/Flat.File.Baby.it.xlsm',
                beauty: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/it/Flat.File.Beauty.it.xlsm',
                professionalhealthcare: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/it/Flat.File.ProfessionalHealthCare.it.xlsm',
                labsupplies: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/it/Flat.File.LabSupplies.it.xlsm',
                industrial: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/it/Flat.File.Industrial.it.xlsm',
                educationalsupplies: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/it/Flat.File.EducationalSupplies.it.xlsm',
                foodserviceandjansan: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/it/Flat.File.FoodServiceAndJanSan.it.xlsm',
                clothing: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/it/Flat.File.Clothing.it.xlsm',
                computers: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/it/Flat.File.Computers.it.xlsm',
                consumerelectronics: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/it/Flat.File.ConsumerElectronics.it.xlsm',
                foodandbeverages: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/it/Flat.File.FoodAndBeverages.it.xlsm',
                health: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/it/Flat.File.Health.it.xlsm',
                petsupplies: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/it/Flat.File.PetSupplies.it.xlsm',
                home: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/it/Flat.File.Home.it.xlsm',
                tools: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/it/Flat.File.Tools.it.xlsm',
                jewelry: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/it/Flat.File.Jewelry.it.xlsm',
                kitchen: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/it/Flat.File.Kitchen.it.xlsm',
                lawnandgarden: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/it/Flat.File.LawnAndGarden.it.xlsm',
                lighting: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/it/Flat.File.Lighting.it.xlsm',
                luggage: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/it/Flat.File.Luggage.it.xlsm',
                musicalinstruments: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/it/Flat.File.MusicalInstruments.it.xlsm',
                office: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/it/Flat.File.Office.it.xlsm',
                shoes: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/it/Flat.File.Shoes.it.xlsm',
                softwarevideogames: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/it/Flat.File.SoftwareVideoGames.it.xlsm',
                sports: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/it/Flat.File.Sports.it.xlsm',
                eyewear: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/it/Flat.File.Eyewear.it.xlsm',
                toysbaby: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/it/Flat.File.ToysBaby.it.xlsm',
                watches: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/it/Flat.File.Watches.it.xlsm',
            },
        jp:
            {
                consumerelectronics: 'https://s3.amazonaws.com/category-custom-templates/ff/jp/Flat.File.ConsumerElectronics.jp.xlsm',
                cameraandphoto: 'https://s3.amazonaws.com/category-custom-templates/ff/jp/Flat.File.CameraAndPhoto.jp.xlsm',
                home: 'https://s3.amazonaws.com/category-custom-templates/ff/jp/Flat.File.Home.jp.xlsm',
                softwarevideogames: 'https://s3.amazonaws.com/category-custom-templates/ff/jp/Flat.File.SoftwareVideoGames.jp.xlsm',
                toys: 'https://s3.amazonaws.com/category-custom-templates/ff/jp/Flat.File.Toys.jp.xlsm',
                sports: 'https://s3.amazonaws.com/category-custom-templates/ff/jp/Flat.File.Sports.jp.xlsm',
                health: 'https://s3.amazonaws.com/category-custom-templates/ff/jp/Flat.File.Health.jp.xlsm',
                foodandbeverages: 'https://s3.amazonaws.com/category-custom-templates/ff/jp/Flat.File.FoodAndBeverages.jp.xlsm',
                watches: 'https://s3.amazonaws.com/category-custom-templates/ff/jp/Flat.File.Watches.jp.xlsm',
                clothing: 'https://s3.amazonaws.com/category-custom-templates/ff/jp/Flat.File.Clothing.jp.xlsm',
                beauty: 'https://s3.amazonaws.com/category-custom-templates/ff/jp/Flat.File.Beauty.jp.xlsm',
                jewelry: 'https://s3.amazonaws.com/category-custom-templates/ff/jp/Flat.File.Jewelry.jp.xlsm',
                computers: 'https://s3.amazonaws.com/category-custom-templates/ff/jp/Flat.File.Computers.jp.xlsm',
                office: 'https://s3.amazonaws.com/category-custom-templates/ff/jp/Flat.File.Office.jp.xlsm',
                homeimprovement: 'https://s3.amazonaws.com/category-custom-templates/ff/jp/Flat.File.HomeImprovement.jp.xlsm',
                mechanicalfasteners: 'https://s3.amazonaws.com/category-custom-templates/ff/jp/Flat.File.MechanicalFasteners.jp.xlsm',
                labsupplies: 'https://s3.amazonaws.com/category-custom-templates/ff/jp/Flat.File.LabSupplies.jp.xlsm',
                industrial: 'https://s3.amazonaws.com/category-custom-templates/ff/jp/Flat.File.Industrial.jp.xlsm',
                autoaccessory: 'https://s3.amazonaws.com/category-custom-templates/ff/jp/Flat.File.AutoAccessory.jp.xlsm',
                musicalinstruments: 'https://s3.amazonaws.com/category-custom-templates/ff/jp/Flat.File.MusicalInstruments.jp.xlsm',
                petsupplies: 'https://s3.amazonaws.com/category-custom-templates/ff/jp/Flat.File.PetSupplies.jp.xlsm',
                largeappliances: 'https://s3.amazonaws.com/category-custom-templates/ff/jp/Flat.File.LargeAppliances.jp.xlsm',
                kindleaccessories: 'https://s3.amazonaws.com/category-custom-templates/ff/jp/Flat.File.KindleAccessories.jp.xlsm',
                music: 'https://s3.amazonaws.com/category-custom-templates/ff/jp/Flat.File.Music.jp.xlsm',
                video: 'https://s3.amazonaws.com/category-custom-templates/ff/jp/Flat.File.Video.jp.xlsm',
                bookloader: 'https://s3.amazonaws.com/category-custom-templates/ff/jp/Flat.File.BookLoader.jp.xlsm',
            },
        mx:
            {
                autoaccessory: 'https://s3.amazonaws.com/category-custom-templates/ff/na/mx/Flat.File.AutoAccessory.mx.xlsm',
                tiresandwheels: 'https://s3.amazonaws.com/category-custom-templates/ff/na/mx/Flat.File.TiresAndWheels.mx.xlsm',
                baby: 'https://s3.amazonaws.com/category-custom-templates/ff/na/mx/Flat.File.Baby.mx.xlsm',
                beauty: 'https://s3.amazonaws.com/category-custom-templates/ff/na/mx/Flat.File.Beauty.mx.xlsm',
                bookloader: 'https://s3.amazonaws.com/category-custom-templates/ff/na/mx/Flat.File.BookLoader.mx.xlsm',
                cameraandphoto: 'https://s3.amazonaws.com/category-custom-templates/ff/na/mx/Flat.File.CameraAndPhoto.mx.xlsm',
                wireless: 'https://s3.amazonaws.com/category-custom-templates/ff/na/mx/Flat.File.Wireless.mx.xlsm',
                clothing: 'https://s3.amazonaws.com/category-custom-templates/ff/na/mx/Flat.File.Clothing.mx.xlsm',
                coins: 'https://s3.amazonaws.com/category-custom-templates/ff/na/mx/Flat.File.Coins.mx.xlsm',
                computers: 'https://s3.amazonaws.com/category-custom-templates/ff/na/mx/Flat.File.Computers.mx.xlsm',
                consumerelectronics: 'https://s3.amazonaws.com/category-custom-templates/ff/na/mx/Flat.File.ConsumerElectronics.mx.xlsm',
                entertainmentcollectibles: 'https://s3.amazonaws.com/category-custom-templates/ff/na/mx/Flat.File.EntertainmentCollectibles.mx.xlsm',
                home: 'https://s3.amazonaws.com/category-custom-templates/ff/na/mx/Flat.File.Home.mx.xlsm',
                giftcards: 'https://s3.amazonaws.com/category-custom-templates/ff/na/mx/Flat.File.GiftCards.mx.xlsm',
                foodandbeverages: 'https://s3.amazonaws.com/category-custom-templates/ff/na/mx/Flat.File.FoodAndBeverages.mx.xlsm',
                health: 'https://s3.amazonaws.com/category-custom-templates/ff/na/mx/Flat.File.Health.mx.xlsm',
                mechanicalfasteners: 'https://s3.amazonaws.com/category-custom-templates/ff/na/mx/Flat.File.MechanicalFasteners.mx.xlsm',
                labsupplies: 'https://s3.amazonaws.com/category-custom-templates/ff/na/mx/Flat.File.LabSupplies.mx.xlsm',
                powertransmission: 'https://s3.amazonaws.com/category-custom-templates/ff/na/mx/Flat.File.PowerTransmission.mx.xlsm',
                industrial: 'https://s3.amazonaws.com/category-custom-templates/ff/na/mx/Flat.File.Industrial.mx.xlsm',
                jewelry: 'https://s3.amazonaws.com/category-custom-templates/ff/na/mx/Flat.File.Jewelry.mx.xlsm',
                lighting: 'https://s3.amazonaws.com/category-custom-templates/ff/na/mx/Flat.File.Lighting.mx.xlsm',
                music: 'https://s3.amazonaws.com/category-custom-templates/ff/na/mx/Flat.File.Music.mx.xlsm',
                musicalinstruments: 'https://s3.amazonaws.com/category-custom-templates/ff/na/mx/Flat.File.MusicalInstruments.mx.xlsm',
                office: 'https://s3.amazonaws.com/category-custom-templates/ff/na/mx/Flat.File.Office.mx.xlsm',
                outdoors: 'https://s3.amazonaws.com/category-custom-templates/ff/na/mx/Flat.File.Outdoors.mx.xlsm',
                petsupplies: 'https://s3.amazonaws.com/category-custom-templates/ff/na/mx/Flat.File.PetSupplies.mx.xlsm',
                shoes: 'https://s3.amazonaws.com/category-custom-templates/ff/na/mx/Flat.File.Shoes.mx.xlsm',
                softwarevideogames: 'https://s3.amazonaws.com/category-custom-templates/ff/na/mx/Flat.File.SoftwareVideoGames.mx.xlsm',
                sports: 'https://s3.amazonaws.com/category-custom-templates/ff/na/mx/Flat.File.Sports.mx.xlsm',
                sportsmemorabilia: 'https://s3.amazonaws.com/category-custom-templates/ff/na/mx/Flat.File.SportsMemorabilia.mx.xlsm',
                tradingcards: 'https://s3.amazonaws.com/category-custom-templates/ff/na/mx/Flat.File.TradingCards.mx.xlsm',
                homeimprovement: 'https://s3.amazonaws.com/category-custom-templates/ff/na/mx/Flat.File.HomeImprovement.mx.xlsm',
                toys: 'https://s3.amazonaws.com/category-custom-templates/ff/na/mx/Flat.File.Toys.mx.xlsm',
                video: 'https://s3.amazonaws.com/category-custom-templates/ff/na/mx/Flat.File.Video.mx.xlsm',
                watches: 'https://s3.amazonaws.com/category-custom-templates/ff/na/mx/Flat.File.Watches.mx.xlsm',
            },
        se:
            {
                industrial: 'https://category-custom-templates.s3.amazonaws.com/ff/eu/se/Flat.File.Industrial.se.xlsm',
                clothing: 'https://category-custom-templates.s3.amazonaws.com/ff/eu/se/Flat.File.Clothing.se.xlsm',
                consumerelectronics: 'https://category-custom-templates.s3.amazonaws.com/ff/eu/se/Flat.File.ConsumerElectronics.se.xlsm',
                office: 'https://category-custom-templates.s3.amazonaws.com/ff/eu/se/Flat.File.Office.se.xlsm',
                autoaccessory: 'https://category-custom-templates.s3.amazonaws.com/ff/eu/se/Flat.File.AutoAccessory.se.xlsm',
                foodandbeverages: 'https://category-custom-templates.s3.amazonaws.com/ff/eu/se/Flat.File.FoodAndBeverages.se.xlsm',
                baby: 'https://category-custom-templates.s3.amazonaws.com/ff/eu/se/Flat.File.Baby.se.xlsm',
                kitchen: 'https://category-custom-templates.s3.amazonaws.com/ff/eu/se/Flat.File.Kitchen.se.xlsm',
                beauty: 'https://category-custom-templates.s3.amazonaws.com/ff/eu/se/Flat.File.Beauty.se.xlsm',
                cameraandphoto: 'https://category-custom-templates.s3.amazonaws.com/ff/eu/se/Flat.File.CameraAndPhoto.se.xlsm',
                bookloader: 'https://category-custom-templates.s3.amazonaws.com/ff/eu/se/Flat.File.BookLoader.se.xlsm',
                shoes: 'https://category-custom-templates.s3.amazonaws.com/ff/eu/se/Flat.File.Shoes.se.xlsm',
                musicalinstruments: 'https://category-custom-templates.s3.amazonaws.com/ff/eu/se/Flat.File.MusicalInstruments.se.xlsm',
                homeimprovement: 'https://category-custom-templates.s3.amazonaws.com/ff/eu/se/Flat.File.HomeImprovement.se.xlsm',
                sports: 'https://category-custom-templates.s3.amazonaws.com/ff/eu/se/Flat.File.Sports.se.xlsm',
                toys: 'https://category-custom-templates.s3.amazonaws.com/ff/eu/se/Flat.File.Toys.se.xlsm',
                computers: 'https://category-custom-templates.s3.amazonaws.com/ff/eu/se/Flat.File.Computers.se.xlsm',
                softwarevideogames: 'https://category-custom-templates.s3.amazonaws.com/ff/eu/se/Flat.File.SoftwareVideoGames.se.xlsm',
                health: 'https://category-custom-templates.s3.amazonaws.com/ff/eu/se/Flat.File.Health.se.xlsm',
                eyewear: 'https://category-custom-templates.s3.amazonaws.com/ff/eu/se/Flat.File.Eyewear.se.xlsm',
                home: 'https://category-custom-templates.s3.amazonaws.com/ff/eu/se/Flat.File.Home.se.xlsm',
                jewelry: 'https://category-custom-templates.s3.amazonaws.com/ff/eu/se/Flat.File.Jewelry.se.xlsm',
                gourmet: 'https://category-custom-templates.s3.amazonaws.com/ff/eu/se/Flat.File.Gourmet.se.xlsm',
                lighting: 'https://category-custom-templates.s3.amazonaws.com/ff/eu/se/Flat.File.Lighting.se.xlsm',
                luggage: 'https://category-custom-templates.s3.amazonaws.com/ff/eu/se/Flat.File.Luggage.se.xlsm',
                motorcycles: 'https://category-custom-templates.s3.amazonaws.com/ff/eu/se/Flat.File.Motorcycles.se.xlsm',
                music: 'https://category-custom-templates.s3.amazonaws.com/ff/eu/se/Flat.File.Music.se.xlsm',
                lawnandgarden: 'https://category-custom-templates.s3.amazonaws.com/ff/eu/se/Flat.File.LawnAndGarden.se.xlsm',
                petsupplies: 'https://category-custom-templates.s3.amazonaws.com/ff/eu/se/Flat.File.PetSupplies.se.xlsm',
                motoapparel: 'https://category-custom-templates.s3.amazonaws.com/ff/eu/se/Flat.File.MotoApparel.se.xlsm',
                educationalsupplies: 'https://category-custom-templates.s3.amazonaws.com/ff/eu/se/Flat.File.EducationalSupplies.se.xlsm',
                tiresandwheels: 'https://category-custom-templates.s3.amazonaws.com/ff/eu/se/Flat.File.TiresAndWheels.se.xlsm',
                video: 'https://category-custom-templates.s3.amazonaws.com/ff/eu/se/Flat.File.Video.se.xlsm',
                watches: 'https://category-custom-templates.s3.amazonaws.com/ff/eu/se/Flat.File.Watches.se.xlsm',
            },
        uk:
            {
                kindleaccessories: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/uk/Flat.File.KindleAccessories.uk.xlsm',
                autoaccessory: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/uk/Flat.File.AutoAccessory.uk.xlsm',
                tiresandwheels: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/uk/Flat.File.TiresAndWheels.uk.xlsm',
                motoapparel: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/uk/Flat.File.MotoApparel.uk.xlsm',
                baby: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/uk/Flat.File.Baby.uk.xlsm',
                beauty: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/uk/Flat.File.Beauty.uk.xlsm',
                professionalhealthcare: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/uk/Flat.File.ProfessionalHealthCare.uk.xlsm',
                labsupplies: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/uk/Flat.File.LabSupplies.uk.xlsm',
                industrial: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/uk/Flat.File.Industrial.uk.xlsm',
                educationalsupplies: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/uk/Flat.File.EducationalSupplies.uk.xlsm',
                foodserviceandjansan: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/uk/Flat.File.FoodServiceAndJanSan.uk.xlsm',
                foodandbeverages: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/uk/Flat.File.FoodAndBeverages.uk.xlsm',
                bookloader: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/uk/Flat.File.BookLoader.uk.xlsm',
                clothing: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/uk/Flat.File.Clothing.uk.xlsm',
                computers: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/uk/Flat.File.Computers.uk.xlsm',
                consumerelectronics: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/uk/Flat.File.ConsumerElectronics.uk.xlsm',
                eyewear: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/uk/Flat.File.Eyewear.uk.xlsm',
                health: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/uk/Flat.File.Health.uk.xlsm',
                home: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/uk/Flat.File.Home.uk.xlsm',
                homeimprovement: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/uk/Flat.File.HomeImprovement.uk.xlsm',
                jewelry: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/uk/Flat.File.Jewelry.uk.xlsm',
                kitchen: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/uk/Flat.File.Kitchen.uk.xlsm',
                largeappliances: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/uk/Flat.File.LargeAppliances.uk.xlsm',
                lawnandgarden: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/uk/Flat.File.LawnAndGarden.uk.xlsm',
                lighting: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/uk/Flat.File.Lighting.uk.xlsm',
                luggage: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/uk/Flat.File.Luggage.uk.xlsm',
                music: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/uk/Flat.File.Music.uk.xlsm',
                musicalinstruments: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/uk/Flat.File.MusicalInstruments.uk.xlsm',
                office: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/uk/Flat.File.Office.uk.xlsm',
                petsupplies: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/uk/Flat.File.PetSupplies.uk.xlsm',
                shoes: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/uk/Flat.File.Shoes.uk.xlsm',
                softwarevideogames: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/uk/Flat.File.SoftwareVideoGames.uk.xlsm',
                sports: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/uk/Flat.File.Sports.uk.xlsm',
                toys: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/uk/Flat.File.Toys.uk.xlsm',
                watches: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/uk/Flat.File.Watches.uk.xlsm',
                video: 'https://s3.amazonaws.com/category-custom-templates/ff/eu/uk/Flat.File.Video.uk.xlsm',
            },

    };
}
export default Constants;

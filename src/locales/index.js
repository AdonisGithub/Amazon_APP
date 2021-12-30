import CsI18n from "../components/csI18n";

const locale = () => {
  return(
    {
      "Polaris": {
        "Avatar": {
          "label": CsI18n.t("Avatar"),
          "labelWithInitials": CsI18n.t("Avatar with initials {initials}"),
        },

        "Autocomplete": {
          "spinnerAccessibilityLabel": CsI18n.t("Loading")
        },

        "Badge": {
          "PROGRESS_LABELS": {
            "incomplete": CsI18n.t("Incomplete"),
            "partiallyComplete": CsI18n.t("Partially complete"),
            "complete": CsI18n.t("Complete")
          },
          "STATUS_LABELS": {
            "info": CsI18n.t("Info") ,
            "success": CsI18n.t("Success"),
            "warning": CsI18n.t("Warning") ,
            "attention": CsI18n.t("Attention"),
            "new": "New"
          }
        },

        "Button": {
          "spinnerAccessibilityLabel": CsI18n.t("Loading")
        },

        "Common": {
          "checkbox": CsI18n.t("checkbox"),
          "undo": CsI18n.t("Undo"),
          "cancel": CsI18n.t("Cancel"),
          "newWindowAccessibilityHint": "(" + CsI18n.t('opens a new window') + ")"
        },

        "ContextualSaveBar": {
          "save": CsI18n.t("Save"),
          "discard": CsI18n.t("Discard")
        },

        "DataTable": {
          "sortAccessibilityLabel": CsI18n.t("sort {direction} by"),
          "navAccessibilityLabel": CsI18n.t("Scroll table {direction} one column"),
          "totalsRowHeading": CsI18n.t("Totals")
        },

        "DatePicker": {
          "previousMonth": CsI18n.t("Show previous month, {previousMonthName} {showPreviousYear}"),
          "nextMonth": CsI18n.t("Show next month, {nextMonth} {nextYear}"),
          "today": CsI18n.t("Today "),
          "months": {
            "january": CsI18n.t("January") ,
            "february": CsI18n.t("February") ,
            "march": CsI18n.t("March"),
            "april": CsI18n.t("March"),
            "may": CsI18n.t("May"),
            "june": CsI18n.t("June"),
            "july": CsI18n.t("July"),
            "august": CsI18n.t("August"),
            "september": CsI18n.t("September"),
            "october": CsI18n.t("October"),
            "november": CsI18n.t("November"),
            "december": CsI18n.t("December"),
          },
          "daysAbbreviated": {
            "monday": CsI18n.t("Mo"),
            "tuesday": CsI18n.t("Tu"),
            "wednesday": CsI18n.t("We"),
            "thursday": CsI18n.t("Th"),
            "friday": CsI18n.t("Fr"),
            "saturday": CsI18n.t("Sa"),
            "sunday": CsI18n.t("Su")
          }
        },


        "DropZone": {
          "overlayTextFile": CsI18n.t("Drop file to upload"),
          "overlayTextImage": CsI18n.t("Drop image to upload"),
          "errorOverlayTextFile": CsI18n.t("File type is not valid"),
          "errorOverlayTextImage": CsI18n.t("Image type is not valid"),

          "FileUpload": {
            "actionTitleFile": CsI18n.t("Add file"),
            "actionTitleImage": CsI18n.t("Add image"),
            "actionHintFile": CsI18n.t("or drop files to upload"),
            "actionHintImage": CsI18n.t("or drop images to upload")
          }
        },

        "EmptySearchResult": {
          "altText": CsI18n.t("Empty search results")
        },

        "Frame": {
          "skipToContent": CsI18n.t("Skip to content"),
          "Navigation": {
            "closeMobileNavigationLabel": CsI18n.t( "Close navigation")
          }
        },

        "Icon": {
          "backdropWarning": CsI18n.t("The {color} icon doesn’t accept backdrops. The icon colors that have backdrops are: {colorsWithBackDrops}")
        },

        "Modal": {
          "iFrameTitle": CsI18n.t("body markup"),
          "modalWarning": CsI18n.t("These required properties are missing from Modal: {missingProps}")
        },

        "Page": {
          "Header": {
            "iconWarningMessage": CsI18n.t("The icon prop has been removed from Page. Upload an application icon in the Shopify Partners Dashboard 'App setup' section instead.")
          }
        },

        "Pagination": {
          "previous": CsI18n.t("Previous"),
          "next": CsI18n.t("Next"),
          "pagination": CsI18n.t("Pagination")
        },

        "ResourceList": {
          "sortingLabel": CsI18n.t("Sort by"),
          "defaultItemSingular": CsI18n.t("item") ,
          "defaultItemPlural": CsI18n.t("items"),
          "showing": CsI18n.t("Showing {itemsCount} {resource}"),
          "loading": CsI18n.t("Loading {resource}"),
          "selected": CsI18n.t("{selectedItemsCount} selected"),
          "allItemsSelected": CsI18n.t("All {itemsLength}+ {resourceNamePlural} in your store are selected."),
          "selectAllItems": CsI18n.t("Select all {itemsLength}+ {resourceNamePlural} in your store"),
          "emptySearchResultTitle": CsI18n.t("No {resourceNamePlural} found"),
          "emptySearchResultDescription": CsI18n.t("Try changing the filters or search term"),
          "selectButtonText": CsI18n.t("Select"),
          "a11yCheckboxDeselectAllSingle": CsI18n.t("Deselect {resourceNameSingular}"),
          "a11yCheckboxSelectAllSingle": CsI18n.t("Select {resourceNameSingular}"),
          "a11yCheckboxDeselectAllMultiple": CsI18n.t("Deselect all {itemsLength} {resourceNamePlural}"),
          "a11yCheckboxSelectAllMultiple": CsI18n.t("Select all {itemsLength} {resourceNamePlural}"),
          "ariaLiveSingular": CsI18n.t("{itemsLength} item"),
          "ariaLivePlural": CsI18n.t("{itemsLength} items"),

          "Item": {
            "selectItem": CsI18n.t("Select: {accessibilityLabel}"),
            "deselectItem": CsI18n.t("Deselect: {accessibilityLabel}"),
            "actionsDropdown": CsI18n.t("Actions dropdown")
          },

          "BulkActions": {
            "actionsActivatorLabel": CsI18n.t("Actions"),
            "moreActionsActivatorLabel": CsI18n.t("More actions"),
            "warningMessage": CsI18n.t("To provide a better user experience. There should only be a maximum of {maxPromotedActions} promoted actions.")
          },

          "FilterCreator": {
            "filterButtonLabel": CsI18n.t("Filter") ,
            "selectFilterKeyPlaceholder": CsI18n.t("Select a filter\u2026") ,
            "addFilterButtonLabel": CsI18n.t("Add filter"),
            "showAllWhere": CsI18n.t("Show all {resourceNamePlural} where:")
          },

          "FilterControl": {
            "textFieldLabel": CsI18n.t("Search {resourceNamePlural}")
          },

          "FilterValueSelector": {
            "selectFilterValuePlaceholder": CsI18n.t("Select a filter\u2026")
          },

          "DateSelector": {
            "dateFilterLabel": CsI18n.t("Select a value"),
            "dateValueLabel": CsI18n.t("Date"),
            "dateValueError": CsI18n.t("Match YYYY-MM-DD format"),
            "dateValuePlaceholder": CsI18n.t("YYYY-MM-DD"),
            "SelectOptions": {
              "PastWeek": CsI18n.t("in the last week"),
              "PastMonth": CsI18n.t("in the last month"),
              "PastQuarter": CsI18n.t("in the last 3 months"),
              "PastYear": CsI18n.t("in the last year"),
              "ComingWeek": CsI18n.t("next week"),
              "ComingMonth": CsI18n.t("next month"),
              "ComingQuarter": CsI18n.t("in the next 3 months"),
              "ComingYear": CsI18n.t("in the next year"),
              "OnOrBefore": CsI18n.t("on or before"),
              "OnOrAfter": CsI18n.t("on or after")
            },
            "FilterLabelForValue": {
              "past_week": CsI18n.t("in the last week") ,
              "past_month": CsI18n.t("in the last month"),
              "past_quarter": CsI18n.t("in the last 3 months"),
              "past_year": CsI18n.t("in the last year"),
              "coming_week": CsI18n.t("next week"),
              "coming_month": CsI18n.t("next month"),
              "coming_quarter": CsI18n.t("in the next 3 months"),
              "coming_year": CsI18n.t("in the next year"),
              "on_or_before": CsI18n.t("before {date}"),
              "on_or_after": CsI18n.t("after {date}")
            }
          }
        },

        "Spinner": {
          "warningMessage": CsI18n.t("The color {color} is not meant to be used on {size} spinners. The colors available on large spinners are: {colors}")
        },

        "Tag": {
          "ariaLabel": CsI18n.t("Remove {children}")
        },

        "TextField": {
          "characterCount": CsI18n.t("{count} characters"),
          "characterCountWithMaxLength": CsI18n.t("{count} of {limit} characters used")
        }

      }
    }
  )
}

export default locale()
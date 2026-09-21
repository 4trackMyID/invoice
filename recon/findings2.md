## FORM LENGTH 44198
  <input type=file accept=image/png,image/jpg,image/jpeg,image/bmp class=form-control autofocus id=org_logo title="Company Logo" data-is-array=false style=display:none>
  <input class="c-name form-control" type=text value=INVOICE tabindex=5 id=title name=title data-json-node=title data-is-array=false>
  <input type=text id=address1 class="adr bld f20 form-control" style=height:30px tabindex=1 autofocus placeholder="Your Company" onfocus='InvoiceGenerator.showHideErr("address1",!1)' name=company_name data-json-node=company_name data-is-array=false>
  <input type=text id=custName class="adr form-control" tabindex=2 placeholder="Your Name" name=user_name data-json-node=user_name data-is-array=false>
  <input type=text id=address2 class="adr form-control" tabindex=3 placeholder="Company’s Address" name=company_address_1 data-json-node=company_address_1 data-is-array=false>
  <input type=text class="adr form-control" id=address3 tabindex=4 placeholder="City, State Zip" name=company_address_2 data-json-node=company_address_2 data-is-array=false>
  <select class="hide w-auto form-control" tabindex=4 name=country id=companyCountrySelect onchange='InvoiceGenerator.countrySelected("companyCountry")' onblur='InvoiceGenerator.stateSelectorFocusedOut("companyCountry")'>
  <input type=text class="adr form-control" tabindex=4 id=companyCountry placeholder=Country name=company_country data-json-node=company_country data-is-array=false onfocus='InvoiceGenerator.showCountrySelect("companyCountry")'>
  <input type=text value="Bill To:" id=billToLabel class="adr bill-to bld form-control" tabindex=6 name=bill_to_label data-json-node=bill_to_label data-is-array=false>
  <input type=text id=billingAddress1 class="adr form-control" tabindex=6 placeholder="Your Client’s Company" onfocus='InvoiceGenerator.showHideErr("billingAddress1",!1)' name=customer_name data-json-node=customer_name data-is-array=false>
  <input type=text id=billingAddress2 class="adr form-control" tabindex=7 placeholder="Client’s Address" name=customer_billing_address_1 data-json-node=customer_billing_address_1 data-is-array=false>
  <input type=text class="adr form-control" id=billingAddress3 tabindex=8 placeholder="City, State Zip" name=customer_billing_address_2 data-json-node=customer_billing_address_2 data-is-array=false>
  <select class="hide w-auto form-control" tabindex=10 name=country id=customerCountrySelect onchange='InvoiceGenerator.countrySelected("customerCountry")' onblur='InvoiceGenerator.stateSelectorFocusedOut("customerCountry")'>
  <input type=text class="adr form-control" tabindex=10 id=customerCountry placeholder=Country name=customer_billing_country data-json-node=customer_billing_country data-is-array=false onfocus='InvoiceGenerator.showCountrySelect("customerCountry")'>
  <input type=text value=Invoice# id=invNumberLabel class="bld text-left w100 form-control" tabindex=12 name=invoice_number_label data-json-node=invoice_number_label data-is-array=false>
  <input type=text class="w100 form-control" id=invNumber tabindex=13 placeholder=INV-12 name=invoice_number data-json-node=invoice_number data-is-array=false>
  <input type=text value="Invoice Date" id=invoiceDateLabel class="bld text-left w100 form-control" tabindex=14 name=invoice_date_label data-json-node=invoice_date_label data-is-array=false>
  <input class="w100 form-control date-field" type=text id=invoiceDate tabindex=15 name=invoice_date data-json-node=invoice_date data-is-array=false>
  <input value="Due Date" id=dueDateLabel class="bld text-left w100 form-control" type=text tabindex=16 name=due_date_label data-json-node=due_date_label data-is-array=false>
  <input id=dueDate class="w100 form-control date-field" tabindex=17 type=text name=due_date data-json-node=due_date data-is-array=false>
  <input type=hidden id=templateType name=template_type data-json-node=template_type data-is-array=false value=standard>
  <input type=hidden id=itemTableColor name=item_table_color data-json-node=item_table_color data-is-array=false value=000>
  <input style=text-align:left type=text id=itemDescLabel value="Item Description" class="bld w100 form-control font-sm" tabindex=19 name=name data-json-node=name data-is-array=false data-parent-json=line_items_header>
  <input type=text value=Qty id=itemQtyLabel class="bld w100 font-sm" tabindex=19 name=quantity data-json-node=quantity data-is-array=false data-parent-json=line_items_header>
  <input type=text value=Rate id=itemRateLabel class="bld w100 text-left font-sm" tabindex=19 name=rate data-json-node=rate data-is-array=false data-parent-json=line_items_header>
  <input type=text value=Tax id=itemTaxLabel1 class="bld w100 text-left font-sm" tabindex=19 name=tax1 data-json-node=tax1_name data-is-array=false data-parent-json=line_items_header>
  <input type=text value=Amount id=itemAmtLabel class="bld w100 text-right form-control font-sm" style=text-align:right tabindex=19 name=amount data-json-node=amount data-is-array=false data-parent-json=line_items_header>
  <textarea type=text class=w100 tabindex=20 id=itemDesc.0 onkeypress=CreateInvoiceUtil.checkAndAddNewLineItem(this,event) placeholder="Enter item name/description" name=itemDesc.0 data-json-node=name data-is-array=true data-array-parent=line_items>
  <input type=number min=0 onkeypress="return event.charCode>
  <input type=text onkeypress="return event.charCode>
  <input type=number onkeypress="return event.charCode>
  <input readonly type=text class="w100 text-right text-muted" value=0.00 id=itemTaxValue1.0 name=itemTaxValue1.0 data-json-node=tax1_amount data-is-array=true data-array-parent=line_items>
  <input readonly class="cursor-disabled w100 text-right" id=itemTotal.0 title="Amount is calculated automatically." name=itemTotal.0 data-json-node=amount data-is-array=true data-array-parent=line_items value=0.00>
  <textarea type=text class=w100 tabindex=21 id=itemDesc.1 placeholder="Enter item name/description" onkeypress=CreateInvoiceUtil.checkAndAddNewLineItem(this,event) name=itemDesc.1 data-json-node=name data-is-array=true data-array-parent=line_items>
  <input type=number min=0 onkeypress="return event.charCode>
  <input type=text onkeypress="return event.charCode>
  <input type=number onkeypress="return event.charCode>
  <input readonly type=text class="w100 text-right text-muted" value=24.00 id=itemTaxValue1.1 name=itemTaxValue1.1 data-json-node=tax1_amount data-is-array=true data-array-parent=line_items>
  <input readonly class="cursor-disabled w100 text-right" id=itemTotal.1 title="Amount is calculated automatically." name=itemTotal.1 data-json-node=amount data-is-array=true data-array-parent=line_items value=200.00>
  <textarea type=text class=w100 id=itemDesc.2 tabindex=22 placeholder="Enter item name/description" onkeypress=CreateInvoiceUtil.checkAndAddNewLineItem(this,event) name=itemDesc.2 data-json-node=name data-is-array=true data-array-parent=line_items>
  <input type=number min=0 onkeypress="return event.charCode>
  <input type=text onkeypress="return event.charCode>
  <input type=number onkeypress="return event.charCode>
  <input readonly type=text class="w100 text-right text-muted" value=0.00 id=itemTaxValue1.2 name=itemTaxValue1.2 data-json-node=tax1_amount data-is-array=true data-array-parent=line_items>
  <input readonly class="cursor-disabled w100 text-right" id=itemTotal.2 title="Amount is calculated automatically." name=itemTotal.2 data-json-node=amount data-is-array=true data-array-parent=line_items value=0.00>
  <textarea type=text class="w100 lastLineItem" tabindex=23 placeholder="Enter item name/description" onkeypress=CreateInvoiceUtil.checkAndAddNewLineItem(this,event) id=itemDesc.3 name=itemDesc.3 data-json-node=name data-is-array=true data-array-parent=line_items>
  <input type=number min=0 onkeypress="return event.charCode>
  <input type=text onkeypress="return event.charCode>
  <input type=number onkeypress="return event.charCode>
  <input readonly type=text class="w100 text-right text-muted" value=0.00 tabindex=20 id=itemTaxValue1.3 name=itemTaxValue1.3 data-json-node=tax1_amount data-is-array=true data-array-parent=line_items>
  <input readonly class="cursor-disabled w100 text-right" id=itemTotal.3 title="Amount is calculated automatically." name=itemTotal.3 data-json-node=amount data-is-array=true data-array-parent=line_items value=0.00>
  <input type=text value="Sub Total" class="total-label form-control" id=subTotalLabel tabindex=24 name=sub_total_label data-json-node=sub_total_label data-is-array=false>
  <input readonly type=text value=VAT class=total-label id=totalTaxLabel.0 name=taxName.0 data-json-node=tax_name data-is-array=true data-array-parent=taxes>
  <input readonly class="amount bld cursor-disabled" type=text id=totalTaxAmt.0 name=taxValue.0 data-json-node=tax data-is-array=true data-array-parent=taxes>
  <input type=text value=TOTAL class="total-label form-control" id=totalLabel tabindex=26 name=total_label data-json-node=total_label data-is-array=false>
  <select class="hide select-currency" tabindex=27 id=currencySelect onchange='InvoiceGenerator.showCurrencySelect("currencySelect","currencySym")'>
  <input type=hidden id=currencyCode name=currency_code data-json-node=currency_code data-is-array=false value=USD>
  <input type=text style="border:1px solid #444;background-color:#fdf4db" class=currencycodetxt maxlength=5 tabindex=27 id=currencySym value=$ name=currency_symbol data-json-node=currency_symbol data-is-array=false onclick='InvoiceGenerator.showCurrencySelect("currencySym","currencySelect")'>
  <input class="terms form-control" value=Notes id=notesLabel tabindex=28 name=notes_label data-json-node=notes_label data-is-array=false>
  <textarea class="note form-control" id=customerNotes tabindex=29 name=notes data-json-node=notes data-is-array=false>
  <input class="terms form-control" value="Terms & Conditions" id=termsLabel tabindex=30 name=terms_and_conditions_label data-json-node=terms_and_conditions_label data-is-array=false>
  <textarea class="note form-control" id=terms tabindex=31 name=terms_and_conditions data-json-node=terms_and_conditions data-is-array=false>

## SHEET TEXT
name=invoiceGenerator class=inv-generator>
Uploading Logo size should be less than 1MB.
Upload
Upload Logo
240 x 240 pixels @ 72 DPI,
Maximum size of 1MB.
Please fill in your company’s name
U.S.A
United Kingdom
Canada
India
Afghanistan
Aland Islands
Albania
Algeria
American Samoa
Andorra
Angola
Anguilla
Antarctica
Antigua and Barbuda
Argentina
Armenia
Aruba
Australia
Austria
Azerbaijan
Bahamas
Bahrain
Bangladesh
Barbados
Belarus
Belgium
Belize
Benin
Bermuda
Bhutan
Bolivia
Bosnia
Botswana
Bouvet Island
Brazil
British Virgin Islands
Brunei
Bulgaria
Burkina Faso
Burundi
Cambodia
Cameroon
Canada
Cape Verde
Cayman Islands
Central African Republic
Chad
Chile
China
Christmas Island
Cocos Islands
Colombia
Comoros
Congo
Cook Islands
Costa Rica
Ivory Coast
Croatia
Cuba
Cyprus
Czech Republic
Denmark
Djibouti
Dominica
Dominican Republic
Ecuador
Egypt
El Salvador
Equatorial Guinea
Eritrea
Estonia
Ethiopia
Falkland Islands
Faroe Islands
Fiji
Finland
France
French Guiana
French Polynesia
French Southern Territories
Gabon
Gambia
Georgia
Germany
Ghana
Gibraltar
Greece
Greenland
Grenada
Guadeloupe
Guam
Guatemala
Guernsey
Guinea-Bissau
Guinea
Guyana
Haiti
Heard Island and McDonald Islands
Honduras
Hong Kong
Hungary
Iceland
India
Indonesia
Iran
Iraq
Ireland
Isle of Man
Israel
Italy
Jamaica
Japan
Jersey
Jordan
Kazakhstan
Kenya
Kiribati
Kosova Republic
Kuwait
Kyrgyzstan
Laos
Latvia
Lebanon
Lesotho
Liberia
Libya
Liechtenstein
Lithuania
Luxembourg
Macau
Macedonia
Madagascar
Malawi
Malaysia
Maldives
Mali
Malta
Marshall Islands
Martinique
Mauritania
Mauritius
Mayotte
Mexico
Micronesia
Moldova
Monaco
Mongolia
Montenegro
Montserrat
Morocco
Mozambique
Myanmar
Namibia
Nauru
Nepal
Netherlands
Netherlands Antilles
New Caledonia
New Zealand
Nicaragua
Niger
Nigeria
Niue
Norfolk Island
Northern Mariana Islands
North Korea
Norway
Oman
Pakistan
Palau
Palestine
Panama
Papua New Guinea
Paraguay
Peru
Philippines
Pitcairn
Poland
Portugal
Puerto Rico
Qatar
Romania
Russia
Rwanda
Saint Kitts and Nevis
Saint Lucia
Saint Pierre and Miquelon
Saint Vincent and the Grenadines
Samoa
SanMarino
Saudi Arabia
Senegal
Serbia
Seychelles
Sierra Leone
Singapore
Slovakia
Slovenia
Solomon Islands
Somalia
South Africa
South Georgia and the South Sandwich Islands
South Korea
Sri Lanka
Sudan
Suriname
Svalbard and Jan Mayen
Swaziland
Sweden
Switzerland
Syria
Taiwan
Tajikistan
Tanzania
Thailand
Togo
Tokelau
Tonga
Trinidad and Tobago
Tunisia
Turkey
Turkmenistan
Tuvalu
Uganda
Ukraine
United Arab Emirates
United Kingdom
Uruguay
U.S.A
Uzbekistan
Vanuatu
Vatican City
Venezuela
Vietnam
Virgin Islands, British
Virgin Islands, U.S.
Wallis and Futuna
Western Sahara
Yemen
Zambia
Zimbabwe
Please fill in your client’s name or their company name
U.S.A
United Kingdom
Canada
India
Afghanistan
Aland Islands
Albania
Algeria
American Samoa
Andorra
Angola
Anguilla
Antarctica
Antigua and Barbuda
Argentina
Armenia
Aruba
Australia
Austria
Azerbaijan
Bahamas
Bahrain
Bangladesh
Barbados
Belarus
Belgium
Belize
Benin
Bermuda
Bhutan
Bolivia
Bosnia
Botswana
Bouvet Island
Brazil
British Virgin Islands
Brunei
Bulgaria
Burkina Faso
Burundi
Cambodia
Cameroon
Canada
Cape Verde
Cayman Islands
Central African Republic
Chad
Chile
China
Christmas Island
Cocos Islands
Colombia
Comoros
Congo
Cook Islands
Costa Rica
Ivory Coast
Croatia
Cuba
Cyprus
Czech Republic
Denmark
Djibouti
Dominica
Dominican Republic
Ecuador
Egypt
El Salvador
Equatorial Guinea
Eritrea
Estonia
Ethiopia
Falkland Islands
Faroe Islands
Fiji
Finland
France
French Guiana
French Polynesia
French Southern Territories
Gabon
Gambia
Georgia
Germany
Ghana
Gibraltar
Greece
Greenland
Grenada
Guadeloupe
Guam
Guatemala
Guernsey
Guinea-Bissau
Guinea
Guyana
Haiti
Heard Island and McDonald Islands
Honduras
Hong Kong
Hungary
Iceland
India
Indonesia
Iran
Iraq
Ireland
Isle of Man
Israel
Italy
Jamaica
Japan
Jersey
Jordan
Kazakhstan
Kenya
Kiribati
Kosova Republic
Kuwait
Kyrgyzstan
Laos
Latvia
Lebanon
Lesotho
Liberia
Libya
Liechtenstein
Lithuania
Luxembourg
Macau
Macedonia
Madagascar
Malawi
Malaysia
Maldives
Mali
Malta
Marshall Islands
Martinique
Mauritania
Mauritius
Mayotte
Mexico
Micronesia
Moldova
Monaco
Mongolia
Montenegro
Montserrat
Morocco
Mozambique
Myanmar
Namibia
Nauru
Nepal
Netherlands
Netherlands Antilles
New Caledonia
New Zealand
Nicaragua
Niger
Nigeria
Niue
Norfolk Island
Northern Mariana Islands
North Korea
Norway
Oman
Pakistan
Palau
Palestine
Panama
Papua New Guinea
Paraguay
Peru
Philippines
Pitcairn
Poland
Portugal
Puerto Rico
Qatar
Romania
Russia
Rwanda
Saint Kitts and Nevis
Saint Lucia
Saint Pierre and Miquelon
Saint Vincent and the Grenadines
Samoa
SanMarino
Saudi Arabia
Senegal
Serbia
Seychelles
Sierra Leone
Singapore
Slovakia
Slovenia
Solomon Islands
Somalia
South Africa
South Georgia and the South Sandwich Islands
South Korea
Spain
Sri Lanka
Sudan
Suriname
Svalbard and Jan Mayen
Swaziland
Sweden
Switzerland
Syria
Taiwan
Tajikistan
Tanzania
Thailand
Togo
Tokelau
Tonga
Trinidad and Tobago
Tunisia
Turkey
Turkmenistan
Tuvalu
Uganda
Ukraine
United Arab Emirates
United Kingdom
Uruguay
U.S.A
Uzbekistan
Vanuatu
Vatican City
Venezuela
Vietnam
Virgin Islands, British
Virgin Islands, U.S.
Wallis and Futuna
Western Sahara
Yemen
Zambia
Zimbabwe
=46&&event.charCode
=46&&event.charCode
=46&&event.charCode
Brochure Design
=46&&event.charCode
=46&&event.charCode
=46&&event.charCode
=46&&event.charCode
=46&&event.charCode
=46&&event.charCode
=46&&event.charCode
=46&&event.charCode
=46&&event.charCode
Add Line Item
200.00
224.00
224.00
It was great doing business with you.
Please make the payment by the due date.
+ Add Payment Gateway
Receive payments effortlessly
x
Sign up for Zoho Invoice for free and set up an online payment gateway to receive your invoice payments online.
Try It Now!
Crafted with ease using
Visit
zoho.com/invoice
to create truly professional invoices.

## applyTemplateType calls
  applyTemplateType("standard-thumb","standard")
  applyTemplateType("spreadsheet-thumb","excel")
  applyTemplateType("compact-thumb","compact")
## thumbnail aria-labels
  Standard Template
  Spreadsheet Template
  Compact Template

## constructJSONObjectFrmForm
  constructJSONObjectFrmForm:function(e){$("span[data-json-node]").each(function(a,r){var n=$(this);$(e).append($('<input type="hidden" />').attr({name:n.attr("name"),value:n.text()}))});var a=$(e).serializeArray(),r={},n="",t=0,c="",o="",i=0,l={},m=[],s="",u={};for(var y in a){var _=$(document.getElementsByName(a[y].name)).data();if(_){if("inter-state"===CreateInvoiceUtil.GST_TYPE){if(["tax2","tax2_name"].indexOf(_.jsonNode)>-1)continue}if(_.isArray){if(c=_.arrayParent,o=a[y].name.lastIndexOf("."),t=a[y].name.substring(o+1,a[y].name.length),n=""===n?t-1:n,s=""===s?c:s,0===Number(t)){s="",n="",i=0,m=[],l={};continue}Number(t-1)!==Number(n)&&(n=t-1,i+=1,l={}),s!==c&&(s="",i=0,m=[]),l="item_order"===_.jsonNode?this.includeInJSON(l,_.jsonNode,Number(t)):this.includeInJSON(l,_.jsonNode,a[y].value),m[i]=l,r[c]=m}else _.parentJson?(u=this.includeInJSON(u,_.jsonNode,a[y].value),r=this.includeInJSON(r,_.parentJson,u)):r=this.includeInJSON(r,_.jsonNode,a[y].value)}}return r.taxes||(r.taxes=[]),window.isEstimateGenerator&&(r.is_quote=!0),r},includeInJSON:function(e,a,r){return"undefined"!==r&&"null"!==r&&a&&(e[a]=r),e},showCurrencySelect:function(e,a){var r=$("#"+e),n=$("#"+a);r.addClass("hide"),n.removeClass("hide"),$("#currencyCode").attr("value",$("#currencySelect").val()),$("#currencySym").attr("value",$("#currencySelect option:selected").attr("symbol"));var t=$("#currencySelect").val();["USD","AUD","CAD","EUR","INR"].includes(t)&&CreateInvoiceUtil.calculateInvTaxAndTotal(t)},changeStateSelectOption:function(e,a){$("#".concat(e)).val(a),$("#".concat(e,'Select option[value="').concat(a,'"]')).attr("selected","selected")},showStateSelect:function(e){var a=$("#".concat(e,"Select")),r=$("#".concat(e));if("companyState"===e||"gccCompanyState"===e){var n=$("#companyCountrySelect").val();edition===n&&(r.addClass("hide"),a.removeClass("hide"),a.show().focus().click())}else if("placeOfSupply"===e)r.addClass("hide"),a.removeClass("hide"),a.show().focus().click();else{var t=$("#customerCountrySelect").val();edition===t&&(r.addClass("hide"),a.removeClass("hide"),a.show().focus().click())}},stateSelected:function(e){var a=$("#".concat(e,"Select")),r=$("#".concat(e));if(r.val(a.val()

## removeEmptyLineitems
  removeEmptyLineitems:function(e){for(var a=e.line_items,r=0;r<a.length;r++)""===a[r].name&&(e.line_items.splice(r,1),this.removeEmptyLineitems(e));return e},removeCertainEmptyFields:function(e){return""===e.customer_tax_reg_no&&(e.customer_tax_label=isGermanEdition?"":void 0,e.customer_tax_reg_no=isGermanEdition?"":void 0),""===e.company_tax_reg_no&&(e.company_tax_label=void 0,e.company_tax_reg_no=void 0),e},isGermanVATNumber:function(e){return/^DE\d{9}$/.test(e)},isValidEmail:function(e){return/^[a-zA-Z0-9_][a-zA-Z0-9_+\-.'\/&]*@[a-zA-Z0-9.-]{4,256}\.[a-zA-Z]{2,22}$/i.test(e)},validateForm:function(e){var a=this,r=!0;if(e.company_name||(this.showHideErr("address1",!0),r=!1),e.customer_name||(this.showHideErr("billingAddress1",!0),r=!1),e.company_tax_reg_no&&""!==e.company_tax_reg_no.trim()&&"in"===edition){(r=/^[0-9]{2}[0-9a-zA-Z]{13}/.test(e.company_tax_reg_no))||this.showHideErr("company_tax_reg_no",!0)}else["sa","ae","bh","om"].includes(edition)&&(e.customer_tax_reg_no&&""!==e.customer_tax_reg_no.trim()&&(15!==e.customer_tax_reg_no.trim().length||isNaN(e.customer_tax_reg_no))&&(this.showHideErr("customer_tax_reg_no",!0),r=!1),e.company_tax_reg_no&&""!==e.company_tax_reg_no.trim()&&(15!==e.company_tax_reg_no.trim().length||isNaN(e.company_tax_reg_no))&&(this.showHideErr("company_tax_reg_no",!0),r=!1));if(isGermanEdition){[{field:"user_name",errorId:"custName"},{field:"company_email",errorId:"companyEmail"},{field:"customer_company_name",errorId:"billingAddress1"},{field:"customer_email",errorId:"customerEmail"},{field:"customer_name",errorId:"billingCustName"},{field:"company_tax_reg_no",errorId:"company_tax_reg_no"},{field:"company_city",errorId:"companyCity"},{field:"company_state",errorId:"companyState"},{field:"company_postal_code",errorId:"stateZip"},{field:"customer_billing_city",errorId:"billingCity"},{field:"customer_billing_state",errorId:"billingState"},{field:"customer_billing_pincode",errorId:"billingStateZip"},{field:"invoice_number",errorId:"invNumber"}].forEach(function(n){var t=n.field,c=n.errorId;e[t]&&("company_tax_reg_no"!==t||a.isGermanVATNumber(e[t]))&&("company_email"!==t&&"customer_email"!==t||a.isValidEmail(e[t]))||(a.showHideErr(c,!0)

## getInvoicePDF
  getInvoicePDF:function(){var e,a=arguments.length>0&&void 0!==arguments[0]&&arguments[0],r=arguments.length>1&&void 0!==arguments[1]?arguments[1]:null,n=document.invoiceGenerator,t=this.constructJSONObjectFrmForm(n),c=!0;e=isGermanEdition?"de":"en-sg"===edition||"en-ng"===edition?"global":edition||"global",isGermanEdition&&(c=this.validateForm(t)),t=this.removeCertainEmptyFields(t),t=this.removeEmptyLineitems(t);var o=JSON.stringify(t);this.constructBaseUrl();var i=window.isEstimateGenerator?this.baseUrl+"/pdf":this.baseUrl+"/download";if(i+="?edition=".concat(e),a&&(i+="&print=true"),isGermanEdition&&r)i+="&format_type=".concat(r,"&entity=invoice");else if("in"===edition&&a&&window.isInvoiceGenerator){var l=document.querySelector('input[name="print-option"]:checked').value;i+="&no_of_copies=".concat(l)}window.isEstimateGenerator||r||(i+="&format_type=PDF&entity=invoice"),window.isReceiptGenerator&&(i="".concat(i,"&from_receipt_generator=true"));var m="",s=document.querySelector("#org_logo");if(s.disabled&&(m=s.files[0],s.files[0].size>=1048576?(InvoiceGenerator.showHideErr("image_upload",!0),c=!1):InvoiceGenerator.showHideErr("image_upload",!1)),c){var u=new FormData;u.append("JSONString",o),u.append("is_new_template_flow",!0),m&&u.append("org_logo",m);var y=new XMLHttpRequest;y.open("POST",i,u),y.responseType="arraybuffer",y.onload=function(){if(200!==y.status){var e=new TextDecoder("utf-8"),n=new Uint8Array(y.response);n=e.decode(n),n=JSON.parse(n),InvoiceGenerator.showHideErr("response",!0),$("#error_msgs").html(n.message),$("html, body").animate({scrollTop:0},400)}else{var t=InvoiceGenerator.getFileName(r),c=new Blob([y.response],{type:"application/pdf"}),o=document.createElement("a"),i=(window.URL||window.webkitURL).createObjectURL(c);o.href=i,a?window.open(i,"_target"):(o.download=t,o.click()),o.remove()}},y.send(u)}else $("html, body").animate({scrollTop:0},400)},getFileName:function(e){return window.isEstimateGenerator?"Estimate.pdf":window.isReceiptGenerator?"Receipt.pdf":isGermanEdition&&e?"Invoice.".concat(e="XRechnung"===e?"xml":"pdf"):"Invoice.pdf"},showPaymentsContainer:function(){$(".payments-container").toggleClass("hide"),$("#add-payment-gatewa

## saveInvoice
  saveInvoice:function(e,a){var r=$(a);r.attr("disabled",!0);var n=this.constructJSONObjectFrmForm(e);n=this.removeEmptyLineitems(n);var t=this.validateForm(n),c="",o=document.querySelector("#org_logo");o.disabled&&t&&(c=o.files[0],o.files[0].size>=1048576?(InvoiceGenerator.showHideErr("image_upload",!0),t=!1):InvoiceGenerator.showHideErr("image_upload",!1)),this.constructBaseUrl();var i=this.baseUrl+"/save";if(t){var l=JSON.stringify(n),m=new FormData;m.append("JSONString",l),m.append("is_new_template_flow",!0),c&&m.append("org_logo",c),$.ajax({method:"POST",url:i,data:m,processData:!1,contentType:!1}).done(function(e){$("#x_invoice_file_id").val(e.data.file_id),$("#signupModalTemp").show(),r.attr("disabled",!1);var a=document.getElementById("companyName");a.value=document.getElementById("address1").value,a.style.display="none",document.getElementById("country").style.display="none"}).fail(function(e){r.attr("disabled",!1),$("#signupModalTemp").hide();var a=(e.responseJSON||{}).message||"We were unable to save your invoice because of special characters. Please remove these special characters from the invoice and try again.";window.alert(a)})}else r.attr("disabled",!1),$("html, body").animate({scrollTop:0},400)},removeEmptyLineitems:function(e){for(var a=e.line_items,r=0;r<a.length;r++)""===a[r].name&&(e.line_items.splice(r,1),this.removeEmptyLineitems(e));return e},removeCertainEmptyFields:function(e){return""===e.customer_tax_reg_no&&(e.customer_tax_label=isGermanEdition?"":void 0,e.customer_tax_reg_no=isGermanEdition?"":void 0),""===e.company_tax_reg_no&&(e.company_tax_label=void 0,e.company_tax_reg_no=void 0),e},isGermanVATNumber:function(e){return/^DE\d{9}$/.test(e)},isValidEmail:function(e){return/^[a-zA-Z0-9_][a-zA-Z0-9_+\-.'\/&]*@[a-zA-Z0-9.-]{4,256}\.[a-zA-Z]{2,22}$/i.test(e)},validateForm:function(e){var a=this,r=!0;if(e.company_name||(this.showHideErr("address1",!0),r=!1),e.customer_name||(this.showHideErr("billingAddress1",!0),r=!1),e.company_tax_reg_no&&""!==e.company_tax_reg_no.trim()&&"in"===edition){(r=/^[0-9]{2}[0-9a-zA-Z]{13}/.test(e.company_tax_reg_no))||this.showHideErr("company_tax_reg_no",!0)}else["sa","ae","bh","om"].includes(edition)&&(e.cu

## applyTemplateType
  applyTemplateType:function(e,a){for(var r=document.getElementsByClassName("thumbnail-img"),n=0;n<r.length;n++)r[n].classList.contains(e)?(r[n].classList.add("selected-template"),r[n].parentElement.setAttribute("aria-selected","true")):r[n].classList.contains("selected-template")&&(r[n].classList.remove("selected-template"),r[n].parentElement.setAttribute("aria-selected","false"));$("#templateType").attr("value",a)},getLocalStorage:function(e){var a=JSON.parse(window.localStorage.getItem(e));return a?a.expires&&new Date(a.expires)<new Date?(window.localStorage.removeItem(e),null):a:null},currencyList:{AED:{currency_name:"UAE Dirham",currency_symbol:"AED"},AFN:{currency_name:"Afghani",currency_symbol:"AFN"},ALL:{currency_name:"Lek",currency_symbol:"Lek"},AMD:{currency_name:"Armenian Dram",currency_symbol:"AMD"},ANG:{currency_name:"Netherlands Antillian Guilder",currency_symbol:"ƒ"},AOA:{currency_name:"Kwanza",currency_symbol:"AOA"},ARS:{currency_name:"Argentine Peso",currency_symbol:"$"},AUD:{currency_name:"Australian Dollar",currency_symbol:"$"},AWG:{currency_name:"Aruban Guilder",currency_symbol:"ƒ"},AZN:{currency_name:"Azerbaijanian Manat",currency_symbol:"AZN"},BAM:{currency_name:"Convertible Marks",currency_symbol:"KM"},BBD:{currency_name:"Barbados Dollar",currency_symbol:"$"},BDT:{currency_name:"Taka",currency_symbol:"BDT"},BGN:{currency_name:"Bulgarian Lev",currency_symbol:"BGN"},BHD:{currency_name:"Bahraini Dinar",currency_symbol:"BHD"},BIF:{currency_name:"Burundi Franc",currency_symbol:"BIF"},BMD:{currency_name:"Bermudian Dollar (Bermuda Dollar)",currency_symbol:"$"},BND:{currency_name:"Brunei Dollar",currency_symbol:"$"},BOB:{currency_name:"Boliviano",currency_symbol:"$b"},BOV:{currency_name:"Mvdol",currency_symbol:"BOV"},BRL:{currency_name:"Brazilian Real",currency_symbol:"R$"},BSD:{currency_name:"Bahamian Dollar",currency_symbol:"$"},BTC:{currency_name:"Bitcoin",currency_symbol:"BTC"},BTN:{currency_name:"Ngultrum",currency_symbol:"BTN"},BWP:{currency_name:"Pula",currency_symbol:"P"},BYR:{currency_name:"Belarussian Ruble",currency_symbol:"p."},BZD:{currency_name:"Belize Dollar",currency_symbol:"BZ$"},CAD:{currency_name:"Canadian Dollar",currency_symbol:

## calculateItemTotal
  calculateItemTotal=function(e){var a,r=$(e).attr("id").lastIndexOf("."),n=$(e).attr("id").substring(r+1);if(isNaN($("#itemQty\\."+n).val())?$("#itemQty\\."+n).val("1.00"):isNaN($("#itemRate\\."+n).val())&&$("#itemRate\\."+n).val("0.00"),a=(Number($("#itemQty\\."+n).val())*Number($("#itemRate\\."+n).val())).toFixed("2"),"in"===edition)for(var t=1;t<=3;t++){var c=Number($("#itemTax".concat(t,"\\.").concat(n)).val());(isNaN(c)||c<0)&&($("#itemTax".concat(t,"\\.").concat(n)).val("0"),c=0);var o=Number(a)*c/100;$("#itemTaxValue".concat(t,"\\.").concat(n)).val(0===o?"0.00":o.toFixed("2"))}else{var i=$("#itemTax1\\."+n).val();i=null!==i?Number(i):0;var l=Number(a)*i/100;$("#itemTaxValue1\\."+n).val(0===l?"0.00":l.toFixed("2")),["sa","ae","bh","om"].includes(edition)&&CreateInvoiceUtil.calculateItemTableSubTotal()}$("#itemTotal\\."+n).val(a),CreateInvoiceUtil.calculateInvoiceTotal()},CreateInvoiceUtil.calculateInvoiceTotal=function(){for(var e=Number(0),a="",r=1;r<=CreateInvoiceUtil.TOTAL_LINE_ITEMS;r++)null===(a=$("#itemTotal\\."+r))||isNaN(a.val())||(e+=Number(a.val()));e=e.toFixed("2"),$("#subTotal").html(e),CreateInvoiceUtil.calculateInvTaxAndTotal()},CreateInvoiceUtil.calculateRowColumnTotal=function(e){for(var a=Number(0),r="",n=1;n<=CreateInvoiceUtil.TOTAL_LINE_ITEMS;n++)null===(r=$(e+n))||isNaN(r.val())||(a+=Number(r.val()));return a=a.toFixed("2")},CreateInvoiceUtil.calculateI

## calculateInvoiceTotal
  calculateInvoiceTotal=function(){for(var e=Number(0),a="",r=1;r<=CreateInvoiceUtil.TOTAL_LINE_ITEMS;r++)null===(a=$("#itemTotal\\."+r))||isNaN(a.val())||(e+=Number(a.val()));e=e.toFixed("2"),$("#subTotal").html(e),CreateInvoiceUtil.calculateInvTaxAndTotal()},CreateInvoiceUtil.calculateRowColumnTotal=function(e){for(var a=Number(0),r="",n=1;n<=CreateInvoiceUtil.TOTAL_LINE_ITEMS;n++)null===(r=$(e+n))||isNaN(r.val())||(a+=Number(r.val()));return a=a.toFixed("2")},CreateInvoiceUtil.calculateItemTableSubTotal=function(){var e;e=CreateInvoiceUtil.calculateRowColumnTotal("#itemTaxValue1\\."),$("#totalTaxAmountStr").html(e)},CreateInvoiceUtil.checkIfEqual=function(e,a){return function(r){return e===r[a]}},CreateInvoiceUtil.calculateInvTaxAndTotal=function(){var e=Number($("#subTotal").html());if("in"===edition){for(var a=[],r=1;r<=CreateInvoiceUtil.TOTAL_LINE_ITEMS;r++){var n=$("#itemTotal\\."+r);if(null!==n&&!isNaN(n.val())){for(var t=Number(n.val()),c=[],o=1;o<=3;o++)if(2!==o||"inter-state"!==CreateInvoiceUtil.GST_TYPE){var i=$("#itemTax".concat(o,"\\.").concat(r)),l=null!==i?Number(i.val()):0,m=t*l/100;if(m){var s="".concat($("#itemTaxLabel".concat(o)).val()," (").concat(l,"%)");c.push({label:s,tax_amount:m})}}for(var u=0,y=c;u<y.length;u++){var _=y[u],d=a.find(CreateInvoiceUtil.checkIfEqual(_.label,"label"));d?d.tax_amount=Number(_.tax_amount)+Number(d.tax_amount):a.push(_)}}}var b

## calculateTaxSummary
  calculateTaxSummary=function(e,a){var r=a,n=0,t=0;isGCCEdition?$("[tax-summary]:not(.taxsummaryclone)").remove():$("[total-tax]:not(.totalTaxClone)").remove();for(var c=0;c<e.length;c++){var o=e[c],i=o.tax_amount.toFixed(2),l=o.taxable_value.toFixed(2);if(r+=Number(i),t+=Number(i),n+=Number(l),isGCCEdition){var m=$(".taxsummaryclone").clone();m.attr("id","taxsummary.".concat(c+1)).removeClass("taxsummaryclone hide"),$(".taxsummary_label",m).attr("id","taxsummarylabel.".concat(c+1)).attr("name","taxsummarylabel.".concat(c+1)).html(o.label),$(".taxsummary_taxable",m).attr("id","taxsummarytaxable.".concat(c+1)).attr("name","taxsummarytaxable.".concat(c+1)).html(l),$(".taxsummary_tax",m).attr("id","taxsummarytax.".concat(c+1)).attr("name","taxsummarytax.".concat(c+1)).html(i),m.insertAfter("[tax-summary]:last")}else{var s=$(".totalTaxClone").clone();s.attr("id","totalTax.".concat(c+1)).removeClass("totalTaxClone hide"),$("input.total-label",s).attr("id","totalTaxLabel.".concat(c+1)).attr("name","taxName.".concat(c+1)).val(o.label),$("input.amount",s).attr("id","totalTaxAmt.".concat(c+1)).attr("name","taxValue.".concat(c+1)).val(i),isGermanEdition&&$("input.tax-percent",s).attr("id","totalTaxPercent.".concat(c+1)).attr("name","taxPercent.".concat(c+1)).val(o.tax_percent),s.insertAfter("[total-tax]:last")}}return $("#taxsummaryTotalTaxable").html(n.toFixed(2)),$("#taxsummaryTotalTax"

## calculateItemTableSubTotal
  calculateItemTableSubTotal=function(){var e;e=CreateInvoiceUtil.calculateRowColumnTotal("#itemTaxValue1\\."),$("#totalTaxAmountStr").html(e)},CreateInvoiceUtil.checkIfEqual=function(e,a){return function(r){return e===r[a]}},CreateInvoiceUtil.calculateInvTaxAndTotal=function(){var e=Number($("#subTotal").html());if("in"===edition){for(var a=[],r=1;r<=CreateInvoiceUtil.TOTAL_LINE_ITEMS;r++){var n=$("#itemTotal\\."+r);if(null!==n&&!isNaN(n.val())){for(var t=Number(n.val()),c=[],o=1;o<=3;o++)if(2!==o||"inter-state"!==CreateInvoiceUtil.GST_TYPE){var i=$("#itemTax".concat(o,"\\.").concat(r)),l=null!==i?Number(i.val()):0,m=t*l/100;if(m){var s="".concat($("#itemTaxLabel".concat(o)).val()," (").concat(l,"%)");c.push({label:s,tax_amount:m})}}for(var u=0,y=c;u<y.length;u++){var _=y[u],d=a.find(CreateInvoiceUtil.checkIfEqual(_.label,"label"));d?d.tax_amount=Number(_.tax_amount)+Number(d.tax_amount):a.push(_)}}}var b=e;$("[india-gst-total-tax]:not(.totalTaxClone)").remove();for(var v=0;v<a.length;v++){var p=a[v],h=p.tax_amount.toFixed(2);b+=Number(h);var g=$(".totalTaxClone").clone();g.attr("id","totalTax.".concat(v+1)).removeClass("totalTaxClone hide"),$("input.total-label",g).attr("id","totalTaxLabel.".concat(v+1)).attr("name","taxName.".concat(v+1)).val(p.label),$("input.amount",g).attr("id","totalTaxAmt.".concat(v+1)).attr("name","taxValue.".concat(v+1)).val(h),g.insertAfter("[india-gst

## calculateTaxAndTotal
  calculateTaxAndTotal=function(e){for(var a=[],r=1;r<=CreateInvoiceUtil.TOTAL_LINE_ITEMS;r++){var n=$("#itemTotal\\."+r);if(null!==n&&!isNaN(n.val())){var t=[],c=$("#itemTax1\\.".concat(r)),o=null!==c?Number(c.val()):0,i=$("#itemTaxValue1\\.".concat(r)),l=null!==i?Number(i.val()):0,m=(Number($("#itemQty\\."+r).val())*Number($("#itemRate\\."+r).val())).toFixed("2"),s=null!==m?Number(m):0,u=$("#itemDesc\\.".concat(r)).val(),y="".concat($("#itemTaxLabel1").val()," (").concat(o,"%)");isGermanEdition?u&&(l||0===l)&&t.push({label:y,tax_amount:l,taxable_value:s,tax_percent:o}):l&&t.push({label:y,tax_amount:l,taxable_value:s});for(var _=0,d=t;_<d.length;_++){var b=d[_],v=a.find(CreateInvoiceUtil.checkIfEqual(b.label,"label"));v?(v.tax_amount=Number(b.tax_amount)+Number(v.tax_amount),v.taxable_value=Number(b.taxable_value)+Number(v.taxable_value)):a.push(b)}}}var p=CreateInvoiceUtil.calculateTaxSummary(a,e);$("#total").html(p.toFixed(2));var h=CreateInvoiceUtil.amountFormatted(p);$("#total_formatted").html(h)},CreateInvoiceUtil.calculateTaxSummary=function(e,a){var r=a,n=0,t=0;isGCCEdition?$("[tax-summary]:not(.taxsummaryclone)").remove():$("[total-tax]:not(.totalTaxClone)").remove();for(var c=0;c<e.length;c++){var o=e[c],i=o.tax_amount.toFixed(2),l=o.taxable_value.toFixed(2);if(r+=Number(i),t+=Number(i),n+=Number(l),isGCCEdition){var m=$(".taxsummaryclone").clone();m.attr("id","taxsumma

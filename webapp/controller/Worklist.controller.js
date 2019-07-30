/*global location history */
sap.ui.define([
		"com/baba/ZDSD_CHANGESO1/controller/BaseController",
		"sap/ui/model/json/JSONModel",
		"sap/m/MessageBox",
		"com/baba/ZDSD_CHANGESO1/model/formatter",
		"sap/ui/model/Filter",
		"sap/ui/model/FilterOperator",
		"sap/m/Dialog"
	],
	function (BaseController, JSONModel, MessageBox, formatter, Filter, FilterOperator, Dialog) {
		"use strict";

		return BaseController.extend("com.baba.ZDSD_CHANGESO1.controller.Worklist", {

			formatter: formatter,

			/* =========================================================== */
			/* lifecycle methods                                           */
			/* =========================================================== */

			/**
			 * Called when the worklist controller is instantiated.
			 * @public
			 */
			onInit: function () {
				var oViewModel,
					iOriginalBusyDelay,
					oTable = this.byId("table");

				// Put down worklist table's original value for busy indicator delay,
				// so it can be restored later on. Busy handling on the table is
				// taken care of by the table itself.
				iOriginalBusyDelay = oTable.getBusyIndicatorDelay();
				// keeps the search state
				this._aTableSearchState = [];

				// Model used to manipulate control states
				oViewModel = new JSONModel({
					worklistTableTitle: this.getResourceBundle().getText("worklistTableTitle"),
					shareOnJamTitle: this.getResourceBundle().getText("worklistTitle"),
					shareSendEmailSubject: this.getResourceBundle().getText("shareSendEmailWorklistSubject"),
					shareSendEmailMessage: this.getResourceBundle().getText("shareSendEmailWorklistMessage", [location.href]),
					tableNoDataText: this.getResourceBundle().getText("tableNoDataText"),
					tableBusyDelay: 0
				});
				this.setModel(oViewModel, "worklistView");

				// Make sure, busy indication is showing immediately so there is no
				// break after the busy indication for loading the view's meta data is
				// ended (see promise 'oWhenMetadataIsLoaded' in AppController)
				oTable.attachEventOnce("updateFinished", function () {
					// Restore original busy indicator delay for worklist's table
					oViewModel.setProperty("/tableBusyDelay", iOriginalBusyDelay);
				});

				var date = new Date();

				this.byId("DATE").setDateValue(date);

				var oModelt = new JSONModel();
				this.getView().byId("table").setModel(oModelt);
				this.getView().byId("table").getModel().setSizeLimit('500');

				var oModelv = new JSONModel();
				this.getView().byId("oSelect3").setModel(oModelv);
				this.getView().byId("oSelect3").getModel().setSizeLimit('50');

				var myModel = this.getOwnerComponent().getModel();
				myModel.setSizeLimit(500);

				// var oModelL = new JSONModel();
				// this.getView().byId("oSelect1").setModel(oModelL);
				// oModelL.setData({modelData: CUSTOMERSet });   
				// oModelL.setSizeLimit(600);

				this.oSearchField = this.getView().byId("NMATNR");

			},

			onAddDes: function (oEvent) { //sear by Material dialog
				var that = this;
				var oView = that.getView();
				var lord = that.getView().byId("LOADORD")._lastValue;
				if (lord === "" || lord === undefined) {
					sap.m.MessageToast.show("Please Loader Order First");
				} else {
					var oDialog = oView.byId("MDialog");
					// create dialog lazily
					if (!oDialog) {
						// create dialog via fragment factory
						oDialog = sap.ui.xmlfragment(oView.getId(), "com.baba.ZDSD_CHANGESO1.view.DesDialog", this);
						// connect dialog to view (models, lifecycle)
						oView.addDependent(oDialog);
					}
					oDialog.setTitle("Search by description");
					oDialog.open(that);
				}
			},

			onAddDesd: function (oEvent) {
				var that = this;
				var input = that.getView().byId("FETDES").getValue();
				var aTableSearchState = [];
				var sQuery = input;

				if (sQuery && sQuery.length > 0) {
					aTableSearchState = [new Filter("MAKTX", FilterOperator.Contains, sQuery.toUpperCase())];
				}
				this._applySearch(aTableSearchState);
				that.byId("DesDialog").destroy();
			},

			onDesCloseDialog: function (oEvent) {
				var that = this;
				that.byId("DesDialog").destroy();
			},

			// handleLoadItems: function (oControlEvent) {
			// 	debugger;
			// 	oControlEvent.getSource().getBinding("items").resume();
			// },

			// ononMULTA: function (oEvent) {
			// 	var oRow = oEvent.getSource().getParent();
			// 	var atCells = oRow.getCells();
			// 	aCells[2].setValue(10);
			// },

			onTick: function () {
				var oTable = this.getView().byId("table");
				var aItems = oTable.getItems(); //All rows  
				var oModel = oTable.getModel();

				if (aItems.length > 0) {

					for (var iRowIndex = 0; iRowIndex < aItems.length; iRowIndex++) {
						if (aItems[iRowIndex]._bGroupHeader === false) {
							// var l_matnr = oModel.getProperty("MATNR", aItems[iRowIndex].getBindingContext());
							// if (l_matnr !== "" && l_matnr !== undefined && l_matnr !=== null ) {
							var l_comp = oModel.getProperty("PSTYV", aItems[iRowIndex].getBindingContext());
							var l_foc = oModel.getProperty("ITEMCAT", aItems[iRowIndex].getBindingContext());
							if (l_comp === "X" || l_foc === "Y") {
								aItems[iRowIndex].getCells()[6].setEditable(false);
							}
						}
					}
				}

			},

			onRest: function () {
				var oTable = this.getView().byId("table");
				var aItems = oTable.getSelectedItems(); //All rows  ; //All rows  
				// var oModel = aItems.getModel();

				if (aItems.length > 0) {

					for (var iRowIndex = 0; iRowIndex < aItems.length; iRowIndex++) {
						if (aItems[iRowIndex]._bGroupHeader === false) {
							if (aItems[iRowIndex].getCells()[10].getText() === "") {
								aItems[iRowIndex].getCells()[6].setEditable(true);
							}
							if (aItems[iRowIndex].getCells()[1].getIcon() === "sap-icon://ppt-attachment") {
								aItems[iRowIndex].getCells()[6].setEditable(false);
							}
							// if (oModel.getProperty("ITEMCAT", aItems[iRowIndex].getBindingContext()) === "Y") {
							// 	aItems[iRowIndex].getCells()[6].setEditable(false);
							// }

							// aItems[iRowIndex].getCells()[0].setIcon();
							// aItems[iRowIndex].getCells()[0].setText();

						}
					}
				}
			},

			onSuggestM: function (event) {
				//////add
				var oView = this.getView();
				oView.setModel(this.oModel);
				this.oSearchField = oView.byId("searchField");
				//////add

				var sQuery = event.getParameter("suggestValue");
				var aFilters = [];
				if (sQuery) {
					aFilters = new Filter({
						filters: [
							new Filter("MATNR", FilterOperator.Contains, sQuery),
							new Filter("MATNR", FilterOperator.Contains, sQuery.toUpperCase()),
							new Filter("MAKTX", FilterOperator.Contains, sQuery),
							new Filter("MAKTX", FilterOperator.Contains, sQuery.toUpperCase())

						],
						and: false
					});
				}

				this.oSearchField.getBinding("suggestionItems").filter(aFilters);
				this.oSearchField.suggest();
			},

			onBusyS: function (oBusy) {
				oBusy.open();
				oBusy.setBusyIndicatorDelay(40000);
			},

			onBusyE: function (oBusy) {
				oBusy.close();
			},

			onAllMul: function (oEvent) {
				var that = this;

				// table has data
				var aTableSearchState = [];
				that._applySearch(aTableSearchState);

				// var oTable = that.getView().byId("table");
				// var aItems = oTable.getItems(); //All rows  
				// if (aItems.length > 0) {
				// 	sap.m.MessageToast.show("Table already has some data. Kindly process those first");
				// } else {
				// that.onblank(that);
				var vbeln = that.getView().byId("LOADORD").getValue();
				var date = that.getView().byId("DATE").getValue();

				if (vbeln === "" || date === "") {
					sap.m.MessageToast.show("Loader Order or date can not be blank");
				} else {
					var oView = that.getView();
					var oDialog = oView.byId("MulDialog");
					// create dialog lazily
					if (!oDialog) {
						// create dialog via fragment factory
						oDialog = sap.ui.xmlfragment(oView.getId(), "com.baba.ZDSD_CHANGESO1.view.MulDialog", this);
						// connect dialog to view (models, lifecycle)
						oView.addDependent(oDialog);
					}
					oDialog.setTitle("Search All Items");
					oDialog.open();
				}
				// }

			},

			// handleSearch: function (oEvent) {
			// 	var sValue = oEvent.getParameter("value");
			// 	var oFilter = new Filter("MAKTX", sap.ui.model.FilterOperator.Contains, sValue);
			// 	var oBinding = oEvent.getSource().getBinding("items");
			// 	oBinding.filter([oFilter]);
			// },

			onSearchMul: function (oEvt) {
				// add filter for search
				var aFilters = [];
				var sQuery = oEvt.getSource().getValue();
				if (sQuery && sQuery.length > 0) {
					var filter = new Filter("MAKTX", sap.ui.model.FilterOperator.Contains, sQuery.toUpperCase());
					aFilters.push(filter);
				}

				// update list binding
				var list = this.byId("table1");
				var binding = list.getBinding("items");
				binding.filter(aFilters, "Application");

				// if (sQuery && sQuery.length > 0) {
				// 			aTableSearchState = [new Filter("MATNR", FilterOperator.Contains, sQuery)];
				// 			//new Filter("MATNR", FilterOperator.Contains, sQuery.toUpperCase())
				// 		}
				// this._applySearchMul(aFilters);
			},

			handleClose: function (oEvent) {
				var that = this;
				// var aContexts = oEvent.getParameter("selectedContexts");
				// this.byId("MulDialog").destroy();

				// var aTableSearchState = [];
				// 				that._applySearch(aTableSearchState);

				var oTable = that.getView().byId("table");
				var aItems = oTable.getItems(); //All rows  

				var oTable = this.byId("table1");
				var oModel2 = oTable.getModel();

				var aContexts = oTable.getSelectedContexts(); //selected rows marked with checkbox
				for (var i = 0; aContexts.length > i; i++) {
					var matnr = aContexts[i].getObject();
					// var qty =  aContexts[i].getObject();
				}

				var box = that.getView().byId("BOX11").getSelected();
				var pc = that.getView().byId("PC11").getSelected();
				if (box === true) {
					var uom = "BOX";
				} else if (pc === true) {
					uom = "PC";
				}

				that.byId("MulDialog").destroy();

				// // add filter for search
				// var aFilters = [];
				// var sQuery = "100070";
				// if (sQuery && sQuery.length > 0) {
				// 	var filter = new Filter("MATNR", sap.ui.model.FilterOperator.Contains, sQuery.toUpperCase());
				// 	aFilters.push(filter);

				// 	aFilters = new Filter({
				// 		filters: [
				// 			new Filter("MATNR", FilterOperator.Contains, sQuery.toUpperCase()),
				// 			new Filter("VRKME", FilterOperator.Contains, "BOX")
				// 		],
				// 		and: false
				// 	});
				// 	aFilters.push(filter);
				// }

				// this._applySearch(aFilters);
			},

			onblank: function (that) {
				//************************set blank values to table*******************************************//
				var oModel = that.getView().byId("table").getModel();
				var oTable = that.getView().byId("table");
				var data;
				var noData = oModel.getProperty("/data");
				oModel.setData({
					modelData: noData
				});
				oModel.setData({
					modelData: data
				});
				oModel.refresh(true);
				oTable.removeSelections(true);
			},

			onClr: function (oEvent) {
				var that = this;
				that.getView().byId("CONF").setSelected(false);
				that.getView().byId("VLOCK").setSelected(false);
				that.getView().byId("DISABLE_WCHECK").setSelected(false);
				that.getView().byId("NMATNR").setValue();
				that.getView().byId("LOADORD").setValue();
				that.getView().byId("VWT").setValue();
				that.getView().byId("BOX").setValue();
				that.getView().byId("PC").setValue();
				that.getView().byId("TOT").setValue();
				that.getView().byId("HEADER_ZZVERSION").setValue();
				that.onblank(that);

				var oModel = that.getView().byId("oSelect3").getModel();
				var data;
				oModel.setData({
					modelData: data
				});
				oModel.refresh(true);
				that.getView().byId("oSelect3").setSelectedKey();

				// var itemData = oModel.getProperty("/data");
				// itemData.push();
			},

			onSearch1: function (event) {
				var item = event.getParameter("suggestionItem");
				if (item) {
					//sap.m.MessageToast.show(item.getText() + " selected");
				}
			},

			onSuggest1: function (event) {
				var that = this;

				var oView = that.getView();
				var oDialog = oView.byId("Dialog");

				if (!oDialog) {
					// create dialog via fragment factory
					oDialog = sap.ui.xmlfragment(oView.getId(), "com.baba.ZDSD_CHANGESO1.view.Dialog", this);
					// connect dialog to view (models, lifecycle)
					oView.addDependent(oDialog);
				}

				var sQuery = event.getParameter("suggestValue");
				var aFilters = [];
				if (sQuery) {
					aFilters = new Filter({
						filters: [
							new Filter("MATNR", FilterOperator.Contains, sQuery.toUpperCase()),
							new Filter("MAKTX", FilterOperator.Contains, sQuery.toUpperCase())
						],
						and: false
					});
				}

				that.oSearchField1.getBinding("suggestionItems").filter(aFilters);
				that.oSearchField1.suggest();
			},

			onAdd: function (oEvent) { //sear by EAN
				var that = this;
				var oView = that.getView();
				var loadord = that.getView().byId("LOADORD").getValue();
				if (loadord === "" || loadord === undefined) {
					sap.m.MessageToast.show("No Loader Order data given");
				} else {
					var oDialog = oView.byId("Dialog");
					// create dialog lazily
					if (!oDialog) {
						// create dialog via fragment factory
						oDialog = sap.ui.xmlfragment(oView.getId(), "com.baba.ZDSD_CHANGESO1.view.Dialog", this);
						// connect dialog to view (models, lifecycle)
						oView.addDependent(oDialog);
					}
					oDialog.setTitle("Add Material(Barcode)");
					oDialog.focus();
					oDialog.open(that);
				}

			},

			// onEdes: function () {
			// 	var that = this;
			// 	that.getView().byId("EDES").setValue();
			// 	var input = this.getView().byId("FET").getValue();
			// 	if (input !== "") {
			// 		var oTable1 = that.getView().byId("table1");
			// 		var oModel1 = oTable1.getModel();
			// 		var aItems1 = oModel1.oData.data; //All rows

			// 		for (var iRowIndex2 = 0; iRowIndex2 < aItems1.length; iRowIndex2++) {
			// 			var l_maktx = aItems1[iRowIndex2].MAKTX;
			// 			var l_eanb = aItems1[iRowIndex2].EANB;
			// 			var l_eanp = aItems1[iRowIndex2].EANP;

			// 			if (l_eanb === input || l_eanp === input) {
			// 				this.getView().byId("EDES").setValue(l_maktx);
			// 			}
			// 		}
			// 	}
			// },

			onAddS: function (oEvent) { //sear by Material dialog
				var that = this;
				var oView = that.getView();
				var loadord = that.getView().byId("LOADORD").getValue();
				if (loadord === "" || loadord === undefined) {
					sap.m.MessageToast.show("No Loader Order data given");
				} else {
					var oDialog = oView.byId("MDialog");
					// create dialog lazily
					if (!oDialog) {
						// create dialog via fragment factory
						oDialog = sap.ui.xmlfragment(oView.getId(), "com.baba.ZDSD_CHANGESO1.view.MDialog", this);
						// connect dialog to view (models, lifecycle)
						oView.addDependent(oDialog);
					}
					oDialog.setTitle("Add Material");
					// that.byId("MDialog").destroy();
					oDialog.open(that);
				}

			},

			onChk: function (oEvent) {
				var NUM_DECIMAL_PLACES = 0;
				var value = oEvent.getSource().getProperty('value');
				var nval = Number(value);
				// var valueState = isNaN(value) ? "Error" : "Success";
				// oEvent.getSource().setValueState(valueState);

				// if (valueState === "Success") {
				if (value === "") {
					var oRow = oEvent.getSource().getParent();
					var aCells = oRow.getCells();
					aCells[6].setValue(0);
				} else if (nval < 0) {
					oRow = oEvent.getSource().getParent();
					aCells = oRow.getCells();
					aCells[6].setValue(0);
				} else {
					// var decimal = value.split(".");
					// if (decimal.length > 1) {
					// 	oRow = oEvent.getSource().getParent();
					// 	aCells = oRow.getCells();
					// 	aCells[6].setValue(0);
					// }
					oRow = oEvent.getSource().getParent();
					aCells = oRow.getCells();

					var val = aCells[6]._lastValue;

					var input1 = val.split(".");
					var input = input1[0];
					aCells[6].setValue(input);

					// var cval = Number(val).toFixed(NUM_DECIMAL_PLACES);
					// aCells[6].setValue(cval);

					this.onUpdateFinished();
				}
			},

			onDchk: function (oEvent) {
				var value = oEvent.getSource().getProperty('value');
				var nval = Number(value);
				if (value === "") {
					this.byId("FETV").setValue(0);
				} else if (nval < 0) {
					this.byId("FETV").setValue(0);
				} else {
					var input1 = value.split(".");
					var input = input1[0];

					var convval = Number(input).toFixed(0);
					this.byId("FETV").setValue(convval);

				}
			},

			onChk1: function (oEvt) {
				var sSeelectFlg = oEvt.getParameters().selected;
				var selectall = oEvt.getParameters().selectAll;
				if (selectall === true) {
					var a = oEvt.getParameters().listItems;
					for (var i = 0; i < a.length; i++) {
						if (a[i]._bGroupHeader === false) {
							a[i].getCells()[6].setEnabled(false);
						}
					}
				} else {
					a = oEvt.getParameters().listItems;
					if (a.length > 1) {
						for (i = 0; i < a.length; i++) {
							a[i].getCells()[6].setEnabled(true);
						}
					}

					if (sSeelectFlg === true) {
						oEvt.getParameters().listItem.getCells()[6].setEnabled(false);
					} else {
						oEvt.getParameters().listItem.getCells()[6].setEnabled(true);
					}
				}
			},

			//       $(oEditableCells).each(function(i) {
			//         var oEditableCell = oEditableCells[i];
			//         var oMetaData = oEditableCell.getMetadata();
			//         var oElement = oMetaData.getElementName();
			//         if (oElement == "sap.m.Input") {
			//           oEditableCell.setEditable(oFlag);
			//         }
			//       });

			// 		var oItem = oEvent.getSource().getParent();
			// 		var oTable = this.getView().byId("table");
			// 		var oIndex = oTable.indexOfItem(oItem);
			// 		var oModel = oTable.getModel();
			// 		var oFlag = oModel.getProperty("/oIndex");
			// 		if (oFlag === undefined) {
			// 			oModel.setProperty("/oIndex", oIndex);
			// 			this.onPress(oItem, true);
			// 		} else {
			// 			var oPreviousItem = oTable.getItems()[oFlag];
			// 			this.onPress(oPreviousItem, false);
			// 			var oCurrentItem = oTable.getItems()[oIndex];
			// 			oModel.setProperty("/oIndex", oIndex);
			// 			this.onPress(oCurrentItem, true);
			// 		}
			// 	}
			// 	var val = oEvent.getSource().getBindingContext();
			// 	var oSelectedListItem = oEvent.getParameter("listItem");
			// 	var oBindingContext = oSelectedListItem.getBindingContext(); //Get Hold Binding Context of Selected List Item.
			// 	var oPath = oBindingContext.getProperty("MATNR");

			// 	var nval = Number(value);

			// 	// }
			// },

			onAddM: function (oEvent) { //search by material
				var that = this;
				var loadord = that.getView().byId("LOADORD").getValue();
				if (loadord === "" || loadord === undefined) {
					sap.m.MessageToast.show("No Loader Order data given");
				} else {

					var input = that.getView().byId("NMATNR").getValue();
					// var uom = that.getView().byId("oSelect2").getValue();
					var box = that.getView().byId("BOXR").getSelected();
					var pc = that.getView().byId("PCR").getSelected();
					if (box === true) {
						var uom = "BOX";
					} else if (pc === true) {
						uom = "PC";
					}

					if ((input !== "" && input !== undefined) && (uom !== "" && uom !== undefined)) {
						var oTable = this.byId("table");
						var oModel = oTable.getModel();
						var aItems = oModel.oData.data; //All rows  
						var flg = "";

						if (aItems !== undefined) {
							for (var iRowIndex1 = 0; iRowIndex1 < aItems.length; iRowIndex1++) {
								// var l_ean11 = oModel.getProperty("EAN11", aItems[iRowIndex1].getBindingContext());
								var l_matnr = aItems[iRowIndex1].MATNR;
								var l_uom = aItems[iRowIndex1].VRKME;
								if (l_matnr === input && l_uom === uom) {
									flg = "X";
									break;
								}
							}
						}

						if (flg === "X") {
							sap.m.MessageToast.show("Material & UOM already in the list");
						} else {

							// //************************filter Date*******************************************//

							var oBusy = new sap.m.BusyDialog();
							that.onBusyS(oBusy);

							//************************get values from backend based on filter Date*******************************************//

							var oModel1 = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZDSDO_CHANGESO_SRV/", true);
							var itemData = oModel.getProperty("/data");

							oModel1.read("/MATERIALSet(MATNR='" + input + "',VRKME='" + uom + "')", {
								success: function (oData, oResponse) {
									var res = {};
									res = oData;
									that.onRef(that);

									var itemRow = {
										MATNR: res.MATNR,
										MAKTX: res.MAKTX,
										VRKME: res.VRKME,
										EAN11: res.EAN11
									};

									if (typeof itemData !== "undefined" && itemData.length > 0) {
										itemData.push(itemRow);
									} else {
										itemData = [];
										itemData.push(itemRow);
									}

									// }

									// // Set Model
									oModel.setData({
										data: itemData
									});

									oModel.refresh(true);

									sap.m.MessageToast.show("New Items " + input + "/" + uom + " Added");

									//************************get values from backend based on filter Date*******************************************//

									that.onBusyE(oBusy);
									// that.onMarkChk(); //mark added

								},
								error: function (oResponse) {
									that.onBusyE(oBusy);
									var oMsg = JSON.parse(oResponse.responseText);
									jQuery.sap.require("sap.m.MessageBox");
									MessageBox.error(oMsg.error.message.value);
									// sap.m.MessageToast.show(oMsg.error.message.value);
								}
							});
						}

					} else {
						sap.m.MessageToast.show("Please add material & UOM");
					}

				}
			},

			onAddMD: function (oEvent) { //search by material dialog
				var that = this;
				var loadord = that.getView().byId("LOADORD").getValue();
				if (loadord === "" || loadord === undefined) {
					sap.m.MessageToast.show("No Loader Order data given");
				} else {

					var input0 = that.getView().byId("searchField").getValue();
					var input1 = input0.split(" - ");
					var input = input1[0];

					var val = that.getView().byId("FETV").getValue();
					var box = that.getView().byId("BOXD").getSelected();
					var pc = that.getView().byId("PCD").getSelected();
					if (box === true) {
						var uom = "BOX";
					} else if (pc === true) {
						uom = "PC";
					}

					if ((input !== "" && input !== undefined) && (uom !== "" && uom !== undefined)) {
						var oTable = this.byId("table");
						var oModel = oTable.getModel();
						var aItems = oModel.oData.data; //All rows  
						var flg = "";

						if (aItems !== undefined) {
							for (var iRowIndex1 = 0; iRowIndex1 < aItems.length; iRowIndex1++) {
								// var l_ean11 = oModel.getProperty("EAN11", aItems[iRowIndex1].getBindingContext());
								var l_matnr = aItems[iRowIndex1].MATNR;
								var l_uom = aItems[iRowIndex1].VRKME;
								if (l_matnr === input && l_uom === uom) {
									flg = "X";
									// aItems[iRowIndex1].KWMENG = val;
									// oModel.refresh(true);
									break;
								}
							}
						}

						if (flg === "X") {
							sap.m.MessageToast.show("Material & UOM already in the list");
						} else {

							// //************************filter Date*******************************************//

							var oBusy = new sap.m.BusyDialog();
							that.onBusyS(oBusy);

							//************************get values from backend based on filter Date*******************************************//

							var oModel1 = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZDSDO_CHANGESO_SRV/", true);
							var itemData = oModel.getProperty("/data");

							oModel1.read("/MATERIALSet(MATNR='" + input + "',VRKME='" + uom + "')", {
								success: function (oData, oResponse) {
									var res = {};
									res = oData;
									that.onRef(that);

									var itemRow = {
										MATNR: res.MATNR,
										MAKTX: res.MAKTX,
										VRKME: res.VRKME,
										EAN11: res.EAN11,
										KWMENG: val,
										NEW: "X"
									};

									if (typeof itemData !== "undefined" && itemData.length > 0) {
										itemData.push(itemRow);
									} else {
										itemData = [];
										itemData.push(itemRow);
									}

									// }

									// // Set Model
									oModel.setData({
										data: itemData
									});

									oModel.refresh(true);

									sap.m.MessageToast.show("New Items " + input + "/" + uom + " Added");

									//************************get values from backend based on filter Date*******************************************//

									that.onBusyE(oBusy);

								},
								error: function (oResponse) {
									that.onBusyE(oBusy);
									var oMsg = JSON.parse(oResponse.responseText);
									jQuery.sap.require("sap.m.MessageBox");
									MessageBox.error(oMsg.error.message.value);
									// sap.m.MessageToast.show(oMsg.error.message.value);
								}
							});
						}

						that.getView().byId("searchField").setValue();
						that.getView().byId("FETV").setValue("");

					} else {
						sap.m.MessageToast.show("Please add material & UOM");
					}

				}
			},

			onMarkChk: function (oEvent) {
				// var oTable = this.byId("table");
				// var aContexts = oTable.getItems(); //selected rows marked with checkbox

				// if(aContexts.length > 0){
				// 	for( var i = 0; i < aContexts.length; i++){
				// 	 //aContexts[i].getCells()[6].setEnabled(false);
				// 	 var item =  aContexts[i];
				// 	 if (item )
				// 	item.getCells(6).setEnabled(false);
				// 	}

				// }
			},

			onFetch: function (oEvent) {
				var that = this;
				var oView = that.getView();
				var oDialog = oView.byId("FDialog");
				// create dialog lazily
				if (!oDialog) {
					// create dialog via fragment factory
					oDialog = sap.ui.xmlfragment(oView.getId(), "com.baba.ZDSD_CHANGESO1.view.FDialog", this);
					// connect dialog to view (models, lifecycle)
					oView.addDependent(oDialog);
				}
				oDialog.setTitle("Fetch Item(Barcode)");
				oDialog.open(that);
			},

			onPri: function (oEvent, final) {
				this._printForm(oEvent, final, "");
			},

			onPrintItemized: function () {
				this._callFragment("PrintItemizedDialog");
			},

			onPrintItemizedOk: function (oEvent) {
				var selectedUom = this.byId("rbUomType").getSelectedIndex();
				this.byId("PrintItemizedDialog").close();
				this._printForm(oEvent, "", selectedUom);
			},

			onPrintItemizedClose: function () {
				this.byId("PrintItemizedDialog").close();
			},

			_printForm: function (oEvent, final, selectedUom) {
				var ord = this.getView().byId("LOADORD")._lastValue;
				var kunnr = this.getView().byId("oSelect1").getSelectedKey();
				var date = this.getView().byId("DATE")._lastValue;
				var flg = "";
				if (ord === "") {
					sap.m.MessageToast.show("No Loader Order data given");
					flg = "X";
				}
				if (kunnr === "" || kunnr === undefined) {
					sap.m.MessageToast.show("No Route user selected");
					flg = "X";
				}
				if (date === "" || date === undefined) {
					sap.m.MessageToast.show("No Date selected");
					flg = "X";
				}
				if (final !== "X") {
					var ver = this.getView().byId("oSelect3").getSelectedKey();
				} else {
					ver = "";
				}
				if (flg === "") {
					var url = "/sap/opu/odata/sap/ZDSDO_CHANGESO_SRV/PRINTSet(VBELN='" + ord + "',KUNNR='" + kunnr + "',DATE='" +
						date + "',VER='" + ver + "',UOM='" + selectedUom + "')/$value";
					sap.m.URLHelper.redirect(url, true);
					// new sap.m.Link(url, true);
				}
			},

			// onPend: function (oEvent) {
			// 	var that = this;
			// 	var oTable = that.getView().byId("table");
			// 	var aItems = oTable.getItems(); //All rows  
			// 	if (aItems.length > 0) {
			// 		sap.m.MessageToast.show("Table already has some data. Kindly process those first");
			// 	} else {
			// 		that.onblank(that);
			// 		var vbeln = that.getView().byId("LOADORD").getValue();
			// 		var date = that.getView().byId("DATE").getValue();

			// 		if (vbeln === "" || date === "") {
			// 			sap.m.MessageToast.show("Loader Order or date can not be blank");
			// 		} else {
			// 			var oModel = that.getView().byId("table").getModel();

			// 			var oModel1 = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZDSDO_CHANGESO_SRV/", true);
			// 			var itemData = oModel.getProperty("/data");
			// 			var oBusy = new sap.m.BusyDialog();
			// 			that.onBusyS(oBusy);

			// 			// //************************filter Date*******************************************//
			// 			var PLFilters = [];
			// 			PLFilters.push(new sap.ui.model.Filter({
			// 				path: "VBELN",
			// 				operator: sap.ui.model.FilterOperator.EQ,
			// 				value1: vbeln
			// 			}));
			// 			PLFilters.push(new sap.ui.model.Filter({
			// 				path: "VDATU",
			// 				operator: sap.ui.model.FilterOperator.EQ,
			// 				value1: date
			// 			}));

			// 			PLFilters.push(new sap.ui.model.Filter({
			// 				path: "TYPE",
			// 				operator: sap.ui.model.FilterOperator.EQ,
			// 				value1: "U"
			// 			}));
			// 			oModel1.read("/UNCONFSet", {
			// 				filters: PLFilters,

			// 				success: function (oData, oResponse) {
			// 					var res = [];
			// 					res = oData.results;

			// 					if (res.length > 0) {
			// 						for (var iRowIndex = 0; iRowIndex < res.length; iRowIndex++) {
			// 							var itemRow = {
			// 								MATNR: res[iRowIndex].MATNR,
			// 								MAKTX: res[iRowIndex].MAKTX,
			// 								VRKME: res[iRowIndex].VRKME,
			// 								EAN11: res[iRowIndex].EAN11,
			// 								POSNR: res[iRowIndex].POSNR,
			// 								KWMENG: res[iRowIndex].KWMENG,
			// 								BMENG: res[iRowIndex].BMENG,
			// 								PSTYV: res[iRowIndex].PSTYV,
			// 								NTGEW: res[iRowIndex].NTGEW,
			// 								ITEMCAT: res[iRowIndex].ITEMCAT
			// 							};
			// 							if (iRowIndex === 0) {
			// 								var tbox = that.onConv(res[iRowIndex].QTY_BOX);
			// 								var box = tbox + "/" + res[iRowIndex].CTR_BOX;

			// 								var tpc = that.onConv(res[iRowIndex].QTY_PC);
			// 								var pc = tpc + "/" + res[iRowIndex].CTR_PC;

			// 								that.getView().byId("BOX").setValue(box);
			// 								that.getView().byId("PC").setValue(pc);
			// 								that.getView().byId("TOT").setValue(res[iRowIndex].NTGEW);
			// 							}

			// 							if (typeof itemData !== "undefined" && itemData.length > 0) {
			// 								itemData.push(itemRow);
			// 							} else {
			// 								itemData = [];
			// 								itemData.push(itemRow);
			// 							}

			// 						}

			// 						// // Set Model
			// 						oModel.setData({
			// 							data: itemData
			// 						});
			// 						oModel.refresh(true);
			// 					}
			// 					sap.m.MessageToast.show("Pending Items added");

			// 					//************************get values from backend based on filter Date*******************************************//
			// 					that.onBusyE(oBusy);

			// 				},
			// 				error: function (oResponse) {
			// 					that.onBusyE(oBusy);
			// 					var oMsg = JSON.parse(oResponse.responseText);
			// 					jQuery.sap.require("sap.m.MessageBox");
			// 					sap.m.MessageToast.show(oMsg.error.message.value);
			// 				}
			// 			});
			// 		}

			// 	}

			// },

			////////////////////////////			
			onPend: function (oEvent) {
				var that = this;

				//no filter
				var aTableSearchState = [];
				that._applySearch(aTableSearchState);

				var oTable = that.getView().byId("table");
				var aItems = oTable.getItems(); //All rows  
				if (aItems.length > 0) {
					sap.m.MessageToast.show("Table already has some data. Kindly process those first");
				} else {
					that.onblank(that);
					var vbeln = that.getView().byId("LOADORD").getValue();
					var date = that.getView().byId("DATE").getValue();

					if (vbeln === "" || date === "") {
						sap.m.MessageToast.show("Loader Order or date can not be blank");
					} else {
						var oView = that.getView();
						var oDialog = oView.byId("PDialog");
						// create dialog lazily
						if (!oDialog) {
							// create dialog via fragment factory
							oDialog = sap.ui.xmlfragment(oView.getId(), "com.baba.ZDSD_CHANGESO1.view.PDialog", this);
							// connect dialog to view (models, lifecycle)
							oView.addDependent(oDialog);
						}
						oDialog.setTitle("Search Pending Items");
						oDialog.open();
					}

				}

			},

			onPOkDialog: function () {
				var that = this;

				var alla = that.getView().byId("ALLA").getSelected();
				var boxa = that.getView().byId("BOXA").getSelected();
				var pca = that.getView().byId("PCA").getSelected();

				if (alla === true) {
					var val = "A";
				} else if (boxa === true) {
					val = "B";
				} else if (pca === true) {
					val = "P";
				}

				var vbeln = that.getView().byId("LOADORD").getValue();
				var date = that.getView().byId("DATE").getValue();
				var oModel = that.getView().byId("table").getModel();

				var zzversion = that.getView().byId("oSelect3").getSelectedKey();

				var oModel1 = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZDSDO_CHANGESO_SRV/", true);
				var itemData = oModel.getProperty("/data");
				var oBusy = new sap.m.BusyDialog();
				that.onBusyS(oBusy);

				// //************************filter Date*******************************************//
				var PLFilters = [];
				PLFilters.push(new sap.ui.model.Filter({
					path: "VBELN",
					operator: sap.ui.model.FilterOperator.EQ,
					value1: vbeln
				}));
				PLFilters.push(new sap.ui.model.Filter({
					path: "VDATU",
					operator: sap.ui.model.FilterOperator.EQ,
					value1: date
				}));

				PLFilters.push(new sap.ui.model.Filter({
					path: "TYPE",
					operator: sap.ui.model.FilterOperator.EQ,
					value1: "U"
				}));

				PLFilters.push(new sap.ui.model.Filter({
					path: "ITEMCAT",
					operator: sap.ui.model.FilterOperator.EQ,
					value1: val
				}));

				PLFilters.push(new sap.ui.model.Filter({
					path: "ZZVERSION",
					operator: sap.ui.model.FilterOperator.EQ,
					value1: zzversion
				}));

				oModel1.read("/UNCONFSet", {
					filters: PLFilters,

					success: function (oData, oResponse) {
						var res = [];
						res = oData.results;

						if (res.length > 0) {
							for (var iRowIndex = 0; iRowIndex < res.length; iRowIndex++) {
								var itemRow = {
									MATNR: res[iRowIndex].MATNR,
									MAKTX: res[iRowIndex].MAKTX,
									VRKME: res[iRowIndex].VRKME,
									EAN11: res[iRowIndex].EAN11,
									POSNR: res[iRowIndex].POSNR,
									KWMENG: res[iRowIndex].KWMENG,
									BMENG: res[iRowIndex].BMENG,
									PSTYV: res[iRowIndex].PSTYV,
									NTGEW: res[iRowIndex].NTGEW,
									ITEMCAT: res[iRowIndex].ITEMCAT,
									ZZVERSION: res[iRowIndex].ZZVERSION,
									ZZVERLOCK: res[iRowIndex].ZZVERLOCK
								};
								if (iRowIndex === 0) {
									var tbox = that.onConv(res[iRowIndex].QTY_BOX);
									var box = tbox + "/" + res[iRowIndex].CTR_BOX;

									var tpc = that.onConv(res[iRowIndex].QTY_PC);
									var pc = tpc + "/" + res[iRowIndex].CTR_PC;

									that.getView().byId("BOX").setValue(box);
									that.getView().byId("PC").setValue(pc);
									that.getView().byId("TOT").setValue(res[iRowIndex].NTGEW);
								}

								if (typeof itemData !== "undefined" && itemData.length > 0) {
									itemData.push(itemRow);
								} else {
									itemData = [];
									itemData.push(itemRow);
								}

							}

							// // Set Model
							oModel.setData({
								data: itemData
							});
							oModel.refresh(true);
						}
						sap.m.MessageToast.show("Pending Items added");

						//************************get values from backend based on filter Date*******************************************//
						that.onBusyE(oBusy);

					},
					error: function (oResponse) {
						that.onBusyE(oBusy);
						var oMsg = JSON.parse(oResponse.responseText);
						jQuery.sap.require("sap.m.MessageBox");
						sap.m.MessageToast.show(oMsg.error.message.value);
					}
				});

				that.byId("Dialog").destroy();
			},
			////////////////////////////

			// onAll: function (oEvent) {
			// 	var that = this;
			// 	var oTable = that.getView().byId("table");
			// 	var aItems = oTable.getItems(); //All rows  
			// 	if (aItems.length > 0) {
			// 		sap.m.MessageToast.show("Table already has some data. Kindly process those first");
			// 	} else {
			// 		that.onblank(that);
			// 		var vbeln = that.getView().byId("LOADORD").getValue();
			// 		var date = that.getView().byId("DATE").getValue();

			// 		if (vbeln === "" || date === "") {
			// 			sap.m.MessageToast.show("Loader Order or date can not be blank");
			// 		} else {
			// 			var oModel = that.getView().byId("table").getModel();

			// 			var oModel1 = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZDSDO_CHANGESO_SRV/", true);
			// 			var itemData = oModel.getProperty("/data");
			// 			var oBusy = new sap.m.BusyDialog();
			// 			that.onBusyS(oBusy);

			// 			// //************************filter Date*******************************************//
			// 			var PLFilters = [];
			// 			PLFilters.push(new sap.ui.model.Filter({
			// 				path: "VBELN",
			// 				operator: sap.ui.model.FilterOperator.EQ,
			// 				value1: vbeln
			// 			}));
			// 			PLFilters.push(new sap.ui.model.Filter({
			// 				path: "VDATU",
			// 				operator: sap.ui.model.FilterOperator.EQ,
			// 				value1: date
			// 			}));

			// 			PLFilters.push(new sap.ui.model.Filter({
			// 				path: "TYPE",
			// 				operator: sap.ui.model.FilterOperator.EQ,
			// 				value1: "A"
			// 			}));
			// 			oModel1.read("/UNCONFSet", {
			// 				filters: PLFilters,

			// 				success: function (oData, oResponse) {
			// 					var res = [];
			// 					res = oData.results;

			// 					if (res.length > 0) {
			// 						for (var iRowIndex = 0; iRowIndex < res.length; iRowIndex++) {
			// 							var itemRow = {
			// 								MATNR: res[iRowIndex].MATNR,
			// 								MAKTX: res[iRowIndex].MAKTX,
			// 								VRKME: res[iRowIndex].VRKME,
			// 								EAN11: res[iRowIndex].EAN11,
			// 								POSNR: res[iRowIndex].POSNR,
			// 								KWMENG: res[iRowIndex].KWMENG,
			// 								BMENG: res[iRowIndex].BMENG,
			// 								PSTYV: res[iRowIndex].PSTYV,
			// 								NTGEW: res[iRowIndex].NTGEW,
			// 								ITEMCAT: res[iRowIndex].ITEMCAT
			// 							};
			// 							if (iRowIndex === 0) {
			// 								var tbox = that.onConv(res[iRowIndex].QTY_BOX);
			// 								var box = tbox + "/" + res[iRowIndex].CTR_BOX;

			// 								var tpc = that.onConv(res[iRowIndex].QTY_PC);
			// 								var pc = tpc + "/" + res[iRowIndex].CTR_PC;

			// 								that.getView().byId("BOX").setValue(box);
			// 								that.getView().byId("PC").setValue(pc);
			// 								that.getView().byId("TOT").setValue(res[iRowIndex].NTGEW);
			// 							}

			// 							if (typeof itemData !== "undefined" && itemData.length > 0) {
			// 								itemData.push(itemRow);
			// 							} else {
			// 								itemData = [];
			// 								itemData.push(itemRow);
			// 							}

			// 						}

			// 						// // Set Model
			// 						oModel.setData({
			// 							data: itemData
			// 						});
			// 						oModel.refresh(true);
			// 					}
			// 					sap.m.MessageToast.show("All Items Fetched");

			// 					//************************get values from backend based on filter Date*******************************************//
			// 					that.onBusyE(oBusy);
			// 					//that.onMarkChk();

			// 				},
			// 				error: function (oResponse) {
			// 					that.onBusyE(oBusy);
			// 					var oMsg = JSON.parse(oResponse.responseText);
			// 					jQuery.sap.require("sap.m.MessageBox");
			// 					sap.m.MessageToast.show(oMsg.error.message.value);
			// 				}
			// 			});
			// 		}

			// 	}

			// },

			///////////////////////////////////////////////////
			onAll: function (oEvent) {
				var that = this;

				// table has data
				var aTableSearchState = [];
				that._applySearch(aTableSearchState);

				var oTable = that.getView().byId("table");
				var aItems = oTable.getItems(); //All rows  
				if (aItems.length > 0) {
					sap.m.MessageToast.show("Table already has some data. Kindly process those first");
				} else {
					that.onblank(that);
					var vbeln = that.getView().byId("LOADORD").getValue();
					var date = that.getView().byId("DATE").getValue();

					if (vbeln === "" || date === "") {
						sap.m.MessageToast.show("Loader Order or date can not be blank");
					} else {
						var oView = that.getView();
						var oDialog = oView.byId("ADialog");
						// create dialog lazily
						if (!oDialog) {
							// create dialog via fragment factory
							oDialog = sap.ui.xmlfragment(oView.getId(), "com.baba.ZDSD_CHANGESO1.view.ADialog", this);
							// connect dialog to view (models, lifecycle)
							oView.addDependent(oDialog);
						}
						oDialog.setTitle("Search All Items");
						oDialog.open();
					}
				}
			},

			onAOkDialog: function () {
				var that = this;

				var alla = that.getView().byId("ALLA").getSelected();
				var boxa = that.getView().byId("BOXA").getSelected();
				var pca = that.getView().byId("PCA").getSelected();

				if (alla === true) {
					var val = "A";
				} else if (boxa === true) {
					val = "B";
				} else if (pca === true) {
					val = "P";
				}

				var oModel = that.getView().byId("table").getModel();

				var vbeln = that.getView().byId("LOADORD").getValue();
				var date = that.getView().byId("DATE").getValue();

				var zzversion = that.getView().byId("oSelect3").getSelectedKey();

				var oModel1 = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZDSDO_CHANGESO_SRV/", true);
				var itemData = oModel.getProperty("/data");
				var oBusy = new sap.m.BusyDialog();
				that.onBusyS(oBusy);

				// //************************filter Date*******************************************//
				var PLFilters = [];
				PLFilters.push(new sap.ui.model.Filter({
					path: "VBELN",
					operator: sap.ui.model.FilterOperator.EQ,
					value1: vbeln
				}));
				PLFilters.push(new sap.ui.model.Filter({
					path: "VDATU",
					operator: sap.ui.model.FilterOperator.EQ,
					value1: date
				}));

				PLFilters.push(new sap.ui.model.Filter({
					path: "TYPE",
					operator: sap.ui.model.FilterOperator.EQ,
					value1: "A"
				}));

				PLFilters.push(new sap.ui.model.Filter({
					path: "ITEMCAT",
					operator: sap.ui.model.FilterOperator.EQ,
					value1: val
				}));

				PLFilters.push(new sap.ui.model.Filter({
					path: "ZZVERSION",
					operator: sap.ui.model.FilterOperator.EQ,
					value1: zzversion
				}));

				oModel1.read("/UNCONFSet", {
					filters: PLFilters,

					success: function (oData, oResponse) {
						var res = [];
						res = oData.results;

						if (res.length > 0) {
							for (var iRowIndex = 0; iRowIndex < res.length; iRowIndex++) {
								var itemRow = {
									MATNR: res[iRowIndex].MATNR,
									MAKTX: res[iRowIndex].MAKTX,
									VRKME: res[iRowIndex].VRKME,
									EAN11: res[iRowIndex].EAN11,
									POSNR: res[iRowIndex].POSNR,
									KWMENG: res[iRowIndex].KWMENG,
									BMENG: res[iRowIndex].BMENG,
									PSTYV: res[iRowIndex].PSTYV,
									NTGEW: res[iRowIndex].NTGEW,
									ITEMCAT: res[iRowIndex].ITEMCAT,
									ZZVERSION: res[iRowIndex].ZZVERSION,
									ZZVERLOCK: res[iRowIndex].ZZVERLOCK
								};
								if (iRowIndex === 0) {
									var tbox = that.onConv(res[iRowIndex].QTY_BOX);
									var box = tbox + "/" + res[iRowIndex].CTR_BOX;

									var tpc = that.onConv(res[iRowIndex].QTY_PC);
									var pc = tpc + "/" + res[iRowIndex].CTR_PC;

									that.getView().byId("BOX").setValue(box);
									that.getView().byId("PC").setValue(pc);
									that.getView().byId("TOT").setValue(res[iRowIndex].NTGEW);
								}

								if (typeof itemData !== "undefined" && itemData.length > 0) {
									itemData.push(itemRow);
								} else {
									itemData = [];
									itemData.push(itemRow);
								}

							}

							// // Set Model
							oModel.setData({
								data: itemData
							});
							oModel.refresh(true);
						}
						sap.m.MessageToast.show("All Items Fetched");

						//************************get values from backend based on filter Date*******************************************//
						that.onBusyE(oBusy);
					},
					error: function (oResponse) {
						that.onBusyE(oBusy);
						var oMsg = JSON.parse(oResponse.responseText);
						jQuery.sap.require("sap.m.MessageBox");
						sap.m.MessageToast.show(oMsg.error.message.value);
					}
				});

				that.byId("ADialog").destroy();
			},

			///////////////////////////////////////////////////
			onConv: function (conval) {
				var no = 0;
				var tval = Number(conval);
				tval.toFixed(no);
				return tval;
			},

			onDel: function (oControlEvent) {
				var oTable = this.getView().byId("table");
				this.onDelM(oTable, "");
			},

			onDelM: function (oTable, val) {
				var oModel2 = oTable.getModel();
				var aRows = oModel2.getData().data;
				var aContexts = oTable.getSelectedContexts();
				// Loop backward from the Selected Rows
				// var aContexts = oTable.getContexts();
				if (aContexts.length > 0) {
					if (val === "") {
						for (var i = aContexts.length - 1; i >= 0; i--) {

							// Selected Row
							var oThisObj = aContexts[i].getObject();
							// $.map() is used for changing the values of an array.
							// Here we are trying to find the index of the selected row
							// refer - http://api.jquery.com/jquery.map/
							var oIndex = $.map(aRows, function (obj, oIndex) {
								if (obj === oThisObj) {
									return oIndex;
								}
							});

							// The splice() method adds/removes items to/from an array
							// Here we are deleting the selected index row
							// https://www.w3schools.com/jsref/jsref_splice.asp
							aRows.splice(oIndex, 1);
						}
						// Set the Model with the Updated Data after Deletion
						oModel2.setData({
							data: aRows
						});
						// Reset table selection in UI5
						oTable.removeSelections(true);
					} else if (val === "X") {
						// Selected Row
						for (i = aContexts.length - 1; i >= 0; i--) {
							oThisObj = aContexts[i].getObject();
							return oThisObj;
						}
					}
				} else {
					sap.m.MessageToast.show("No Line items selected for Deletion");
					return "X";
				}
			},

			onDelnew: function () {
				var that = this;
				var oTable = this.getView().byId("table");
				var oModel2 = oTable.getModel();
				// var aRows = oModel2.getData().data;

				var aTableSearchState = [];
				that._applySearch(aTableSearchState);

				var aContexts = oTable.getItems();

				// var asContexts = oTable.getSelectedContexts();

				var itemData = [];

				for (var i = 0; i < aContexts.length; i++) {
					if (aContexts[i]._bGroupHeader === false) {
						var pro = aContexts[i];

						var val = pro.getSelected();

						if (val === false) {

							itemData.push({
								BMENG: oModel2.getProperty("BMENG", aContexts[i].getBindingContext()),
								EAN11: oModel2.getProperty("EAN11", aContexts[i].getBindingContext()),
								ITEMCAT: oModel2.getProperty("ITEMCAT", aContexts[i].getBindingContext()),
								KWMENG: oModel2.getProperty("KWMENG", aContexts[i].getBindingContext()),
								MAKTX: oModel2.getProperty("MAKTX", aContexts[i].getBindingContext()),
								MATNR: oModel2.getProperty("MATNR", aContexts[i].getBindingContext()),
								NTGEW: oModel2.getProperty("NTGEW", aContexts[i].getBindingContext()),
								POSNR: oModel2.getProperty("POSNR", aContexts[i].getBindingContext()),
								PSTYV: oModel2.getProperty("PSTYV", aContexts[i].getBindingContext()),
								VRKME: oModel2.getProperty("VRKME", aContexts[i].getBindingContext()),
								ZZVERSION: oModel2.getProperty("ZZVERSION", aContexts[i].getBindingContext()),
								ZZVERLOCK: oModel2.getProperty("ZZVERLOCK", aContexts[i].getBindingContext())
							});
						}

					}

				}

				// Set the Model with the Updated Data after Deletion
				oModel2.setData({
					data: itemData
				});

				// Reset table selection in UI5
				oTable.removeSelections(true);

				// Set the Model with the Updated Data after Deletion
				// oModel2.setData({
				// 	data: aRows
				// });
			},

			onFOkDialog: function (path) {
				var that = this;
				var input = that.getView().byId("FETA").getValue();
				var vbeln = that.getView().byId("LOADORD").getValue();
				var date = that.getView().byId("DATE").getValue();
				var oModel = that.getView().byId("table").getModel();
				var aItems = that.getView().byId("table").getItems(); //All rows  

				if (vbeln === "" || date === "") {
					sap.m.MessageToast.show("No Loader Order or date given");
				} else {
					if (input === "") {
						sap.m.MessageToast.show("Please Provide EAN");
					} else {

						var oModel1 = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZDSDO_CHANGESO_SRV/", true);
						var itemData = oModel.getProperty("/data");
						var oBusy = new sap.m.BusyDialog();
						that.onBusyS(oBusy);

						// //************************filter Date*******************************************//
						var PLFilters = [];
						PLFilters.push(new sap.ui.model.Filter({
							path: "VBELN",
							operator: sap.ui.model.FilterOperator.EQ,
							value1: vbeln
						}));
						PLFilters.push(new sap.ui.model.Filter({
							path: "VDATU",
							operator: sap.ui.model.FilterOperator.EQ,
							value1: date
						}));

						PLFilters.push(new sap.ui.model.Filter({
							path: "TYPE",
							operator: sap.ui.model.FilterOperator.EQ,
							value1: "M"
						}));
						PLFilters.push(new sap.ui.model.Filter({
							path: "EAN11",
							operator: sap.ui.model.FilterOperator.EQ,
							value1: input
						}));

						oModel1.read("/FETCHSet", {
							filters: PLFilters,
							success: function (oData, oResponse) {
								var res = [];
								res = oData.results;

								if (res.length > 0) {
									for (var iRowIndex = 0; iRowIndex < res.length; iRowIndex++) {
										var flg = "";
										if (aItems.length > 0) {
											var iRowIndex1 = 0;
											for (iRowIndex1 = 0; iRowIndex1 < aItems.length; iRowIndex1++) {
												var l_posnr = oModel.getProperty("POSNR", aItems[iRowIndex1].getBindingContext());
												if (l_posnr === res[iRowIndex].POSNR) {
													flg = "X";
													break;
												}
											}
										}

										if (flg === "") {
											flg = "";
											var itemRow = {
												MATNR: res[iRowIndex].MATNR,
												MAKTX: res[iRowIndex].MAKTX,
												VRKME: res[iRowIndex].VRKME,
												EAN11: res[iRowIndex].EAN11,
												POSNR: res[iRowIndex].POSNR,
												KWMENG: res[iRowIndex].KWMENG,
												BMENG: res[iRowIndex].BMENG,
												PSTYV: res[iRowIndex].PSTYV,
												NTGEW: res[iRowIndex].NTGEW,
												ITEMCAT: res[iRowIndex].ITEMCAT
											};
											if (iRowIndex === 0) {
												var tbox = that.onConv(res[iRowIndex].QTY_BOX);
												var tpc = that.onConv(res[iRowIndex].QTY_PC);

												var box = tbox + "/" + res[iRowIndex].CTR_BOX;
												var pc = tpc + "/" + res[iRowIndex].CTR_PC;

												that.getView().byId("BOX").setValue(box);
												that.getView().byId("PC").setValue(pc);
												that.getView().byId("TOT").setValue(res[iRowIndex].NTGEW);

												that.getView().byId("HEADER_ZZVERSION").setValue(res[iRowIndex].ZZVERSION);
											}

											if (typeof itemData !== "undefined" && itemData.length > 0) {
												itemData.push(itemRow);
											} else {
												itemData = [];
												itemData.push(itemRow);
											}

											// // Set Model
											oModel.setData({
												data: itemData
											});
											oModel.refresh(true);
											sap.m.MessageToast.show("Fetched Items added");
										}

									}
								}

								//************************get values from backend based on filter Date*******************************************//
								that.onBusyE(oBusy);
								if (flg === "X") {
									sap.m.MessageToast.show("Fetched Items added");
								}
							},
							error: function (oResponse) {
								that.onBusyE(oBusy);
								var oMsg = JSON.parse(oResponse.responseText);
								jQuery.sap.require("sap.m.MessageBox");
								sap.m.MessageToast.show(oMsg.error.message.value);
							}
						});

						that.getView().byId("FETA").setValue();
						that.byId("Dialog").destroy();
						// that.byId("Dialog").close();
					}

				}
			},

			// onOkDialog: function (path) {
			// 	var that = this;
			// 	var input = that.getView().byId("FET").getValue();
			// 	var uom = that.getView().byId("oSelect2")._lastValue;
			// 	if (input === "" || uom === "") {
			// 		sap.m.MessageToast.show("Please provide Material and UOM");
			// 	} else {
			// 		var oModel = that.getView().byId("table").getModel();
			// 		var oModel1 = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZDSDO_CHANGESO_SRV/", true);
			// 		var itemData = oModel.getProperty("/data");
			// 		var oBusy = new sap.m.BusyDialog();
			// 		that.onBusyS(oBusy);

			// 		oModel1.read("/MATERIALSet(MATNR='" + input + "',VRKME='" + uom + "')", {
			// 			success: function (oData, oResponse) {

			// 				var res = {};
			// 				res = oData;

			// 				if (res !== "") {
			// 					var itemRow = {
			// 						MATNR: res.MATNR,
			// 						MAKTX: res.MAKTX,
			// 						VRKME: res.VRKME,
			// 						EAN11: res.EAN11
			// 					};

			// 					if (typeof itemData !== "undefined" && itemData.length > 0) {
			// 						itemData.push(itemRow);
			// 					} else {
			// 						itemData = [];
			// 						itemData.push(itemRow);
			// 					}

			// 					// // Set Model
			// 					oModel.setData({
			// 						data: itemData
			// 					});
			// 					oModel.refresh(true);
			// 				}
			// 				sap.m.MessageToast.show("Material " + res.MATNR + " added");

			// 				//************************get values from backend based on filter Date*******************************************//
			// 				that.onBusyE(oBusy);

			// 			},
			// 			error: function (oResponse) {
			// 				that.onBusyE(oBusy);
			// 				var oMsg = JSON.parse(oResponse.responseText);
			// 				jQuery.sap.require("sap.m.MessageBox");
			// 				sap.m.MessageToast.show(oMsg.error.message.value);
			// 			}
			// 		});
			// 		that.getView().byId("FET").setValue();
			// 		that.byId("Dialog").destroy();
			// 		// that.byId("Dialog").close();
			// 	}
			// },

			onOkDialog: function (path) {
				var that = this;
				that.onRef();
				var input = that.getView().byId("FET").getValue();

				that.getView().byId("FET").focus();

				var qval = that.getView().byId("FETV").getValue(); //add

				if (input === "") {
					sap.m.MessageToast.show("Please provide EAN");
				} else {
					var oTable = this.byId("table");
					var oModel = oTable.getModel();
					var aItems = oModel.oData.data; //All rows  
					var flg = "";

					if (aItems !== undefined) {
						for (var iRowIndex1 = 0; iRowIndex1 < aItems.length; iRowIndex1++) {
							var l_ean = aItems[iRowIndex1].EAN11;

							if (l_ean === input) {
								flg = "X";
								break;
							}
						}
					}
					if (flg === "X") {
						sap.m.MessageToast.show("EAN already in the list");

						that.onSearch(that, l_ean); //added new

					} else {

						var oModel1 = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZDSDO_CHANGESO_SRV/", true);
						var itemData = oModel.getProperty("/data");
						var oBusy = new sap.m.BusyDialog();
						that.onBusyS(oBusy);

						oModel1.read("/MATERIALSet(MATNR='" + input + "',VRKME='')", {
							success: function (oData, oResponse) {

								var res = {};
								res = oData;

								if (res !== "") {
									var itemRow = {
										MATNR: res.MATNR,
										MAKTX: res.MAKTX,
										VRKME: res.VRKME,
										EAN11: res.EAN11,
										KWMENG: qval, //added
										NEW: "X"
									};

									if (typeof itemData !== "undefined" && itemData.length > 0) {
										itemData.push(itemRow);
									} else {
										itemData = [];
										itemData.push(itemRow);
									}

									// // Set Model
									oModel.setData({
										data: itemData
									});
									oModel.refresh(true);
								}
								sap.m.MessageToast.show("Item " + res.MATNR + " added");

								//************************get values from backend based on filter Date*******************************************//
								that.onBusyE(oBusy);

							},
							error: function (oResponse) {
								that.onBusyE(oBusy);
								var oMsg = JSON.parse(oResponse.responseText);
								jQuery.sap.require("sap.m.MessageBox");
								sap.m.MessageToast.show(oMsg.error.message.value);
								that.byId("Dialog").destroy();
							}
						});
					}
				}

				that.getView().byId("FET").setValue();
				that.getView().byId("FETV").setValue();
				that.getView().byId("EDES").setValue();

				// that.byId("Dialog").destroy();
			},

			onCloseDialog: function () {
				// var that = this;
				var oTable = this.byId("table");
				oTable.getBinding("items").refresh();

				var that = this;
				that.byId("Dialog").destroy();
				// that.byId("Dialog").close();

			},

			onMCloseDialog: function () {
				// var that = this;
				var oTable = this.byId("table");
				oTable.getBinding("items").refresh();

				var that = this;
				that.byId("MDialog").destroy();
				// that.byId("Dialog").close();

				// // added
				// var aTableSearchState = [];
				// 	var sQuery = "NEW"; //oEvent.getParameter("query");

				// 	if (sQuery && sQuery.length > 0) {
				// 		aTableSearchState = [new Filter("VAL", FilterOperator.Contains, sQuery)];
				// 		//new Filter("MATNR", FilterOperator.Contains, sQuery.toUpperCase())
				// 	}
				// 	this._applySearch(aTableSearchState);
				// // added

			},

			onGet: function (oEvent) {
				var that = this;
				//************************get values from backend based on filter Date*******************************************//
				var oModel = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZDSDO_CHANGESO_SRV/", true);
				var oBusy = new sap.m.BusyDialog();

				var kunnr = that.getView().byId("oSelect1").getSelectedKey();
				var date = that.getView().byId("DATE").getValue();
				var currentDate = new Date();
				var selectedDate = new Date(date);

				that.getView().byId("LOADORD").setValue();
				that.getView().byId("BOX").setValue();
				that.getView().byId("PC").setValue();
				that.getView().byId("TOT").setValue();
				that.getView().byId("NMATNR").setValue();
				that.getView().byId("CONF").setSelected(false);
				that.getView().byId("VLOCK").setSelected(false);
				that.getView().byId("HEADER_ZZVERSION").setValue();
				that.onRef();
				that.onblank(that);

				if (kunnr === "" || date === "") {
					sap.m.MessageToast.show("Please select Route & Date to Fetch Loading Order");
				} else {
					//Check selection date
					if (selectedDate < currentDate) {
						sap.m.MessageToast.show("Loading can only be done for current or future date");
					} else {
						that.onBusyS(oBusy);
						oModel.read("/LOADORDSet(KUNNR='" + kunnr + "',VDATU='" + date + "')", {
							success: function (oData, oResponse) {
								var res;
								res = oData;

								if (res !== "") {
									var tbox = that.onConv(res.QTY_BOX);
									var tpc = that.onConv(res.QTY_PC);

									var box = tbox + "/" + res.CTR_BOX;
									var pc = tpc + "/" + res.CTR_PC;

									var ord = res.VBELN;
									that.getView().byId("BOX").setValue(box);
									that.getView().byId("PC").setValue(pc);
									that.getView().byId("TOT").setValue(res.NTGEW);
									that.getView().byId("LOADORD").setValue(ord);
									that.getView().byId("VWT").setValue(res.VWT);
									that.getView().byId("HEADER_ZZVERSION").setValue(res.ZZVERSION);
									that.onVer();
									sap.m.MessageToast.show("Loader Order fetched");
								}

								//************************get values from backend based on filter Date*******************************************//
								that.onBusyE(oBusy);

							},
							error: function (oResponse) {
								that.onBusyE(oBusy);
								var oMsg = JSON.parse(oResponse.responseText);
								jQuery.sap.require("sap.m.MessageBox");
								MessageBox.error(oMsg.error.message.value);
								//sap.m.MessageToast.show(oMsg.error.message.value);
							}
						});
					}
				}
			},

			onVer: function (oEvent) {
				var that = this;
				var oModel = that.getView().byId("oSelect3").getModel();

				var data;

				oModel.setData({
					modelData: data
				});
				oModel.refresh(true);

				var itemData = oModel.getProperty("/data");
				var cver = that.getView().byId("HEADER_ZZVERSION").getValue();
				if (cver === "" || cver === undefined) {
					cver = 0;
				}
				cver = Number(cver);
				var lv_cnt = 0;

				for (var iRowIndex = 1; iRowIndex <= cver; iRowIndex++) {
					lv_cnt = lv_cnt + 1;
					var itemRow = {
						VERN: lv_cnt
					};

					if (typeof itemData !== "undefined" && itemData.length > 0) {
						itemData.push(itemRow);
					} else {
						itemData = [];
						itemData.push(itemRow);
					}

					// // Set Model
					oModel.setData({
						data: itemData
					});

				}

				var itemRow1 = {};
				if (typeof itemData !== "undefined" && itemData.length > 0) {
					itemData.push(itemRow1);
				} else {
					itemData = [];
					itemData.push(itemRow1);
				}

				// itemRow = {};
				// itemData.push(itemRow);
				// // // Set Model
				// oModel.setData({
				// 	data: itemData
				// });
				oModel.refresh(true);

				if (cver > 0) {
					that.getView().byId("oSelect3").setSelectedKey(cver);
				} else {
					that.getView().byId("oSelect3").setSelectedKey(false);
				}
			},

			onSer: function () {
				var that = this;
				var oView = that.getView();
				var oDialog = oView.byId("SDialog");
				// create dialog lazily
				if (!oDialog) {
					// create dialog via fragment factory
					oDialog = sap.ui.xmlfragment(oView.getId(), "com.baba.ZDSD_CHANGESO1.view.SDialog", this);
					// connect dialog to view (models, lifecycle)
					oView.addDependent(oDialog);
				}
				oDialog.setTitle("Search Item(Barcode)");

				oDialog.open(that);

			},

			onSOkDialog: function (thatc) {
				var that = this;
				var input = that.getView().byId("FETS").getValue();

				that.onSearch(that, input);
				that.byId("Dialog").destroy();
				// that.byId("Dialog").close();

			},

			onSave1: function (oEvent) {
				var that = this;
				var fconf = that.getView().byId("CONF").getSelected();
				var vlock = that.getView().byId("VLOCK").getSelected();
				if (fconf === true || vlock === true) {
					if (fconf === true) {
						var message = "Do you want to close Loading Process?";
					} else {
						message = "Do you want to close current version?";
					}

					MessageBox.warning(
						message, {
							actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
							onClose: function (sAction) {
								if (sAction === "OK") {
									that.onSave(oEvent);
								}
							}
						}
					);
				} else {
					that.onSave(oEvent);
				}
			},

			onSave: function (oEvent) {
				var that = this;
				var oTable = that.getView().byId("table");
				var oBusy = new sap.m.BusyDialog();
				var ord = that.getView().byId("LOADORD")._lastValue;
				var date = that.getView().byId("DATE")._lastValue;
				var vwt = that.getView().byId("VWT")._lastValue;
				var oModel2 = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZDSDO_CHANGESO_SRV/", true);

				if (ord === "" || date === "") {
					sap.m.MessageToast.show("No Loader Order or Date given");
				} else {
					var val = that.getView().byId("CONF").getSelected();
					if (val === true) {
						var l_mark1 = "X";
					} else {
						l_mark1 = "";
					}

					// Get version close checkbox value
					var val_vlock = that.getView().byId("VLOCK").getSelected();
					if (val_vlock === true) {
						var l_mark2 = "Y";
					} else {
						l_mark2 = "";
					}

					// Get disable weight check indicator
					var wcheck = that.getView().byId("DISABLE_WCHECK").getSelected();
					if (wcheck === true) {
						var l_mark3 = "X";
					} else {
						l_mark3 = "";
					}

					that.onBusyS(oBusy);

					var aTableSearchState = [];
					that._applySearch(aTableSearchState);
					// Get Items of the Table
					var aItems = oTable.getItems(); //All rows  
					var aContexts = oTable.getSelectedContexts(); //selected rows marked with checkbox from table

					if (l_mark1 === "" && l_mark2 === "" && aContexts.length === 0) {
						sap.m.MessageToast.show("No Items marked for posting");
						that.onBusyE(oBusy);
					} else {
						// Create one emtpy Object
						var oEntry1 = {};
						oEntry1.VBELN = ord;
						oEntry1.CONF = l_mark1;
						oEntry1.VDATU = date;
						oEntry1.VWT = vwt;
						oEntry1.VLOCK = l_mark2;
						oEntry1.WCHECK = l_mark3;

						if ((l_mark1 === "X" || l_mark2 === "Y") && aItems.length === 0) {
							oEntry1.HEADITEMNAV = [];

							oModel2.create("/HEADERSet", oEntry1, {
								success: function (oData, oResponse) {
									var val1 = that.onConv(oData.HEADITEMNAV.results[0].QTY_BOX);
									var val2 = that.onConv(oData.HEADITEMNAV.results[0].QTY_PC);

									var val3 = oData.HEADITEMNAV.results[0].CTR_BOX;
									var val4 = oData.HEADITEMNAV.results[0].CTR_PC;
									var val5 = oData.HEADITEMNAV.results[0].NTGEW;

									var val6 = oData.HEADITEMNAV.results[0].ZZVERSION;

									var box = val1 + "/" + val3;
									var pc = val2 + "/" + val4;

									that.getView().byId("BOX").setValue(box);
									that.getView().byId("PC").setValue(pc);
									that.getView().byId("TOT").setValue(val5);
									that.getView().byId("HEADER_ZZVERSION").setValue(val6);
									that.getView().byId("VLOCK").setSelected(false);
									that.onVer();

									if (l_mark1 === "X") {
										that.onblank(that);
										that.onPri(that, l_mark1);
										that.getView().byId("CONF").setSelected(false);
										that.getView().byId("LOADORD").setValue();
										that.getView().byId("BOX").setValue();
										that.getView().byId("PC").setValue();
										that.getView().byId("TOT").setValue();
										that.getView().byId("VWT").setValue();
										that.getView().byId("HEADER_ZZVERSION").setValue();
										that.onClr();
									}

									sap.m.MessageToast.show(oData.MSG);
									that.onBusyE(oBusy);
								},
								error: function (oResponse) {
									that.onBusyE(oBusy);
									var oMsg = JSON.parse(oResponse.responseText);
									jQuery.sap.require("sap.m.MessageBox");
									sap.m.MessageToast.show(oMsg.error.message.value);
								}
							});
						} else {
							var flg = "",
								cnt = 0;

							if ((l_mark1 === "X" || l_mark2 === "Y") && aItems.length > 0) {
								var oModel = that.getView().byId("table").getModel();
								for (var i = 0; i < aItems.length; i++) {
									var l_matnr = oModel.getProperty("MATNR", aItems[i].getBindingContext());
									if (l_matnr !== null) {
										cnt = cnt + 1;
									}
								}
								var l_cnt = Number(cnt);
								if (aContexts.length !== l_cnt) {
									sap.m.MessageToast.show("For Final Confirmation/Version Close, mark all Items");
									flg = "X";
									that.onBusyE(oBusy);
								}
							}

							if (aItems.length > 0 && flg === "") {
								if (aContexts.length > 0) {
									// Define an empty Array
									var itemData = [];
									for (var iRowIndex1 = 0; iRowIndex1 < aContexts.length; iRowIndex1++) {

										var oThisObj = aContexts[iRowIndex1].getObject();

										var l_qtyc = oThisObj.KWMENG;
										if (oThisObj.KWMENG === "" || oThisObj.KWMENG === undefined || oThisObj.KWMENG === null) {
											l_qtyc = 0;
										}

										var no = "0";
										var valq = Number(l_qtyc).toFixed(no);
										l_qtyc = valq;

										itemData.push({
											POSNR: oThisObj.POSNR,
											MATNR: oThisObj.MATNR,
											VRKME: oThisObj.VRKME,
											KWMENG: l_qtyc,
											PSTYV: oThisObj.ITEMCAT
										});
									}

									//Using Deep entity the data is posted as shown below .
									oEntry1.HEADITEMNAV = itemData;

									that.onBusyS(oBusy);
									oModel2.create("/HEADERSet", oEntry1, {
										success: function (oData, oResponse) {

											var val1 = that.onConv(oData.HEADITEMNAV.results[0].QTY_BOX);
											var val2 = that.onConv(oData.HEADITEMNAV.results[0].QTY_PC);

											var val3 = oData.HEADITEMNAV.results[0].CTR_BOX;
											var val4 = oData.HEADITEMNAV.results[0].CTR_PC;
											var val5 = oData.HEADITEMNAV.results[0].NTGEW;

											var val6 = oData.HEADITEMNAV.results[0].ZZVERSION;

											var box = val1 + "/" + val3;
											var pc = val2 + "/" + val4;

											that.getView().byId("BOX").setValue(box);
											that.getView().byId("PC").setValue(pc);
											that.getView().byId("TOT").setValue(val5);
											that.getView().byId("HEADER_ZZVERSION").setValue(val6);
											that.getView().byId("VLOCK").setSelected(false);

											// that.onDel(that);

											// var sQuery = input; //oEvent.getParameter("query");

											// if (sQuery && sQuery.length > 0) {
											// 	aTableSearchState = [new Filter("MATNR", FilterOperator.Contains, sQuery)];
											// 	//new Filter("MATNR", FilterOperator.Contains, sQuery.toUpperCase())
											// }
											that.onDelnew(that);
											that.onVer();

											if (l_mark1 === "X") {
												that.onPri(that, l_mark1);
												that.getView().byId("CONF").setSelected(false);
												that.getView().byId("LOADORD").setValue();
												that.getView().byId("BOX").setValue();
												that.getView().byId("PC").setValue();
												that.getView().byId("TOT").setValue();
												that.getView().byId("VWT").setValue();
												that.getView().byId("HEADER_ZZVERSION").setValue();
												that.onClr();
											}
											sap.m.MessageToast.show(oData.MSG);
											that.onBusyE(oBusy);
										},
										error: function (oResponse) {
											that.onBusyE(oBusy);
											var oMsg = JSON.parse(oResponse.responseText);
											jQuery.sap.require("sap.m.MessageBox");
											sap.m.MessageToast.show(oMsg.error.message.value);
										}
									});
								} else {
									sap.m.MessageToast.show("No Items marked for posting");
									that.onBusyE(oBusy);
								}
							} else {
								if (flg === "") {
									sap.m.MessageToast.show("No Data for Posting");
									that.onBusyE(oBusy);
								}
							}
						}

					}
				}
			},

			/* =========================================================== */
			/* event handlers                                              */
			/* =========================================================== */

			/**
			 * Triggered by the table's 'updateFinished' event: after new table
			 * data is available, this handler method updates the table counter.
			 * This should only happen if the update was successful, which is
			 * why this handler is attached to 'updateFinished' and not to the
			 * table's list binding's 'dataReceived' method.
			 * @param {sap.ui.base.Event} oEvent the update finished event
			 * @public
			 */
			onUpdateFinished: function (oEvent) {
				// update the worklist's object counter after the table update
				// var sTitle,
				// 	oTable = oEvent.getSource(),
				// 	iTotalItems = oEvent.getParameter("total");
				// // only update the counter if the length is final and
				// // the table is not empty
				// if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
				// 	sTitle = this.getResourceBundle().getText("worklistTableTitleCount", [iTotalItems]);
				// } else {
				// 	sTitle = this.getResourceBundle().getText("worklistTableTitle");
				// }
				// this.getModel("worklistView").setProperty("/worklistTableTitle", sTitle);
				//             var that = this;
				// var oTable = this.getView().byId("table");
				//   var oModel = oTable.getModel();
				//   // Get Items of the Table
				// var aItems = oTable.getItems(oModel);
				// for (var iRowIndex = 0; iRowIndex < aItems.length; iRowIndex++) {
				// 	var l_KWMENG = oModel.getProperty("KWMENG", aItems[iRowIndex].getBindingContext());

				// if ( l_KWMENG === ""|| l_qtyc === undefined)) {
				// 	l_qtyc = 0;
				// }

				// }
				this.onTick();

			},

			// onUpdateS: function (oEvent) {
			// 					var oTabel = this.getView().byId("table").getItems();
			// 	for (var i = 0; i < oTabel.length; i++) {
			// 		if (oTabel[i]._bGroupHeader === false) {
			// 			if (oTabel[i].getCells()[4].getText() === 'BOX') {
			// 				// oTabel[i].getCells()[4].addStyleClass("democlass_red");
			// 				oTabel[i].getCells()[6].setEditable(false);
			// 			} else if (oTabel[i].getCells()[4].getText() === 'PC') {
			// 				oTabel[i].getCells()[4].addStyleClass("democlass_green");
			// 			} else {
			// 				oTabel[i].getCells()[4].addStyleClass("democlass_yellow");
			// 			}
			// 		}
			// 	}
			// },

			// 	onAfterRendering: function () {

			// },

			/**
			 * Event handler when a table item gets pressed
			 * @param {sap.ui.base.Event} oEvent the table selectionChange event
			 * @public
			 */
			onPress: function (oEvent) {
				// The source is the list item that got pressed
				this._showObject(oEvent.getSource());
			},

			/**
			 * Event handler for navigating back.
			 * We navigate back in the browser historz
			 * @public
			 */
			onNavBack: function () {
				history.go(-1);
			},

			onSearch: function (oEvent, input) {
				this.onRef();
				var flg = "";
				var oTable = this.byId("table");
				var oModel = oTable.getModel();
				var aItems = oModel.oData.data; //All rows  

				// var aItems = oTable.getItems(); //All rows  
				if (aItems === undefined) {
					sap.m.MessageToast.show("No Item to search");
				} else {
					for (var iRowIndex1 = 0; iRowIndex1 < aItems.length; iRowIndex1++) {
						// var l_ean11 = oModel.getProperty("EAN11", aItems[iRowIndex1].getBindingContext());
						var l_ean11 = aItems[iRowIndex1].EAN11;
						if (l_ean11 === input) {
							flg = "X";
							break;
						}
					}
				}

				if (flg === "X") {
					var aTableSearchState = [];
					var sQuery = input; //oEvent.getParameter("query");

					if (sQuery && sQuery.length > 0) {
						aTableSearchState = [new Filter("EAN11", FilterOperator.Contains, sQuery)];
						//new Filter("MATNR", FilterOperator.Contains, sQuery.toUpperCase())
					}
					this._applySearch(aTableSearchState);
				} else {
					sap.m.MessageToast.show("Item doesn't exit in list");
				}

			},

			// onSearchA: function (oEvent, input) {
			// 	if (oEvent.getParameters().refreshButtonPressed) {
			// 		// Search field's 'refresh' button has been pressed.
			// 		// This is visible if you select any master list item.
			// 		// In this case no new search is triggered, we only
			// 		// refresh the list binding.
			// 		this.onRefresh();
			// 	} else {
			// 		//if (input !== ""){
			// 		var aTableSearchState = [];
			// 		var sQuery = oEvent.getParameter("query");

			// 		if (sQuery && sQuery.length > 0) {
			// 			aTableSearchState = [new Filter("EAN11", FilterOperator.Contains, sQuery)];
			// 		}
			// 		this._applySearch(aTableSearchState);
			// 		// }else{var oTable = this.byId("table");
			// 		//          	oTable.getBinding("items").refresh();
			// 		//     }
			// 	}

			// },

			// onSearchA: function (oEvent) {
			// 	var input = oEvent.getParameter("query");
			// 	var flg = "";
			// 	var oTable = this.byId("table");
			// 	var oModel = oTable.getModel();
			// 	var aItems = oModel.oData.data; //All rows  

			// 	// var aItems = oTable.getItems(); //All rows  
			// 	if (aItems === undefined) {
			// 		sap.m.MessageToast.show("No Item to search");
			// 	} else {
			// 		for (var iRowIndex1 = 0; iRowIndex1 < aItems.length; iRowIndex1++) {
			// 			// var l_ean11 = oModel.getProperty("EAN11", aItems[iRowIndex1].getBindingContext());
			// 			var l_ean11 = aItems[iRowIndex1].EAN11;
			// 			if (l_ean11 === input) {
			// 				flg = "X";
			// 				break;
			// 			}
			// 		}
			// 	}

			// 	if (flg === "X") {
			// 		this.getView().byId("searchField").setValue(input);
			// 		var aTableSearchState = [];
			// 		var sQuery = input; //oEvent.getParameter("query");

			// 		if (sQuery && sQuery.length > 0) {
			// 			aTableSearchState = [new Filter("EAN11", FilterOperator.Contains, sQuery)];
			// 			//new Filter("MATNR", FilterOperator.Contains, sQuery.toUpperCase())
			// 		}
			// 		this._applySearch(aTableSearchState);
			// 	} else {
			// 		sap.m.MessageToast.show("Item doesn't exit in list");
			// 	}

			// },

			onSearchA: function (oEvent) { //search by material
				this.onRef(this, "X");
				var input0 = oEvent.getParameter("query");
				var input1 = input0.split(" - ");
				var input = input1[0];

				var flg = "";
				var oTable = this.byId("table");
				var oModel = oTable.getModel();
				var aItems = oModel.oData.data; //All rows  

				if (input !== "") {
					// var aItems = oTable.getItems(); //All rows  
					if (aItems === undefined) {
						sap.m.MessageToast.show("No Item to search");
					} else {
						for (var iRowIndex1 = 0; iRowIndex1 < aItems.length; iRowIndex1++) {
							// var l_ean11 = oModel.getProperty("EAN11", aItems[iRowIndex1].getBindingContext());
							var l_matnr = aItems[iRowIndex1].MATNR;
							if (l_matnr === input) {
								flg = "X";
								break;
							}
						}
					}

					if (flg === "X") {
						this.getView().byId("NMATNR").setValue(input);
						var aTableSearchState = [];
						var sQuery = input; //oEvent.getParameter("query");

						if (sQuery && sQuery.length > 0) {
							aTableSearchState = [new Filter("MATNR", FilterOperator.Contains, sQuery)];
							//new Filter("MATNR", FilterOperator.Contains, sQuery.toUpperCase())
						}
						this._applySearch(aTableSearchState);
					} else {
						sap.m.MessageToast.show("Item doesn't exit in list");
					}
				} else {
					sQuery = input; //oEvent.getParameter("query");

					if (sQuery && sQuery.length > 0) {
						aTableSearchState = [new Filter("MATNR", FilterOperator.Contains, sQuery)];
						//new Filter("MATNR", FilterOperator.Contains, sQuery.toUpperCase())
					}
					this._applySearch(aTableSearchState);
				}

			},

			onSearch0: function (oEvent) { //search by item 0
				var aTableSearchState = [];
				var sQuery = "0"; //oEvent.getParameter("query");

				if (sQuery && sQuery.length > 0) {
					aTableSearchState = [new Filter("KWMENG", FilterOperator.GT, sQuery)];
					//new Filter("MATNR", FilterOperator.Contains, sQuery.toUpperCase())
				}
				this._applySearch(aTableSearchState);
			},

			onSearchN: function (oEvent) { //search by item 0
				var aTableSearchState = [];
				var sQuery = "X"; //oEvent.getParameter("query");

				var flg = "";
				var oTable = this.byId("table");
				var oModel = oTable.getModel();
				var aItems = oModel.oData.data; //All rows  

				for (var iRowIndex1 = 0; iRowIndex1 < aItems.length; iRowIndex1++) {
					// var l_ean11 = oModel.getProperty("EAN11", aItems[iRowIndex1].getBindingContext());
					var l_new = aItems[iRowIndex1].NEW;
					if (l_new === sQuery) {
						flg = "X";
						break;
					}
				}

				if (flg === "X") {
					if (sQuery && sQuery.length > 0) {
						aTableSearchState = [new Filter("NEW", FilterOperator.EQ, sQuery)];
						//new Filter("MATNR", FilterOperator.Contains, sQuery.toUpperCase())
					}
					this._applySearch(aTableSearchState);
				} else {
					sap.m.MessageToast.show("No new Item added in list");
				}
			},

			/**
			 * Event handler for refresh event. Keeps filter, sort
			 * and group settings and refreshes the list binding.
			 * @public
			 */
			onRefresh: function () {
				var oTable = this.byId("table");
				oTable.getBinding("items").refresh();
			},
			onRef: function (oEvent, SMAT) {
				var that = this;
				// that.getView().byId("searchField").setValue("");
				if (SMAT === "X") {} else {
					that.getView().byId("NMATNR").setValue();
				}
				// that.getView().byId("oSelect2").setValue();
				var aTableSearchState = [];
				// var sQuery = "";

				// if (sQuery && sQuery.length > 0) {
				// 	aTableSearchState = [new Filter("EAN11", FilterOperator.Contains, sQuery)];
				// }
				this._applySearch(aTableSearchState);

			},

			onEdes: function (oEvent) {
				var that = this;
				that.getView().byId("EDES").setValue();
				var viewFET = this.getView().byId("FET");
				if (typeof viewFET === "undefined") {
					viewFET = this.getView().byId("FETS");
				}
				var ean11Input = viewFET.getValue();
				if (ean11Input !== "") {
					var matListTable = that.getView().byId("materialListTable");
					var matListItems = matListTable.getItems();

					for (var iRowIndex = 0; iRowIndex < matListItems.length; iRowIndex++) {
						var maktx = matListItems[iRowIndex].getCells()[1].getText();
						var ean11Box = matListItems[iRowIndex].getCells()[2].getText();
						var ean11Pc = matListItems[iRowIndex].getCells()[3].getText();

						if (ean11Input === ean11Box || ean11Input === ean11Pc) {
							that.getView().byId("EDES").setValue(maktx);
						}
					}
				}
			},

			/* =========================================================== */
			/* internal methods                                            */
			/* =========================================================== */

			/**
			 * Shows the selected item on the object page
			 * On phones a additional history entry is created
			 * @param {sap.m.ObjectListItem} oItem selected Item
			 * @private
			 */
			_showObject: function (oItem) {
				this.getRouter().navTo("object", {
					objectId: oItem.getBindingContext().getProperty("KUNNR")
				});
			},

			/**
			 * Internal helper method to apply both filter and search state together on the list binding
			 * @param {sap.ui.model.Filter[]} aTableSearchState An array of filters for the search
			 * @private
			 */
			_applySearch: function (aTableSearchState) {
				var oTable = this.byId("table"),
					oViewModel = this.getModel("worklistView");
				oTable.getBinding("items").filter(aTableSearchState, "Application");
				// changes the noDataText of the list in case there are no filter results
				if (aTableSearchState !== undefined) {
					if (aTableSearchState.length !== 0) {
						oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
					}
				}
			},

			_applySearchMul: function (aTableSearchState) {
				var oTable = this.byId("table1"),
					oViewModel = this.getModel("worklistView");
				oTable.getBinding("items").filter(aTableSearchState, "Application");
				// changes the noDataText of the list in case there are no filter results
				if (aTableSearchState !== undefined) {
					if (aTableSearchState.length !== 0) {
						oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
					}
				}
			}

		});
	});
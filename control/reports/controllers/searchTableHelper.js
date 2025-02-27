class SearchTableHelper {
	constructor(tableId, tag, config) {
		if (!config) throw "No config provided";
		if (!tableId) throw "No tableId provided";
		this.table = document.getElementById(tableId);
		if (!this.table) throw "Cant find table with ID that was provided";
		this.config = config;
		this.tag = tag;
		this.sort = {};
		this.commands = {};
		this.items = [];
		this.init();
	}
	
	init() {
		this.table.innerHTML = "";
		this.renderHeader();
		this.renderBody();
	}

	renderHeader() {
		if (!this.config.columns) throw "No columns are indicated in the config";
		this.thead = this._create('thead', this.table);
		this.config.columns.forEach(colConfig => {
			let classes = [];
			if (colConfig.type == "date")
				classes = ["text-left"];
			else if (colConfig.type == "number")
				classes = ["text-right"];
			else classes = ["text-left"];
			let th = this._create('th', this.thead, colConfig.header, classes);
			if (colConfig.sortBy) {
				const icon = colConfig.type === 'date' ?
				 this._create('span', th, "", ['icon', 'icon-chevron-down'])
				 : this._create('span', th, "", [])
				const _t = this;
				th.addEventListener('click', function () {
					if (_t.sort[colConfig.sortBy] && _t.sort[colConfig.sortBy] > 0) {
						_t.sort = { [colConfig.sortBy]: -1 };
						_t.items.sort(function(a,b){
							return new Date(a.reportedAt) - new Date(b.reportedAt);
						});
						icon.classList.remove('icon-chevron-up');
						icon.classList.add('icon-chevron-down');
					}
					else {
						_t.sort = { [colConfig.sortBy]: 1 };
						_t.items.sort(function(a,b){
							return new Date(b.reportedAt) - new Date(a.reportedAt);
						});
						icon.classList.remove('icon-chevron-down');
						icon.classList.add('icon-chevron-up');
					}
					_t.tbody.innerHTML = '';
					_t.items.map(r=> _t.renderRow({data:r}))
				});
			}
			if (colConfig.width)
				th.style.width = colConfig.width;
		});

		if (this.config.options.showEditButton)
			this._create('th', this.thead, "Ban", ["editColumn"]);

		if (this.config.options.showDeleteButton)
			this._create('th', this.thead, "Delete", ["deleteColumn"]);
	}

	renderBody() {
		this.tbody = this._create("tbody", this.table);
		let t = this;
		this.tbody.onscroll = e => {
			if (t.tbody.scrollTop / t.tbody.scrollHeight > 0.8)
				t._fetchNextPage();
		};
	}

	search(filter) {
		this.tbody.innerHTML = `<div class="padded">
			<div class="empty-state">
				<h4 class="text-center" style="font-size:16px; line-height:22px;">Loading...</h4>
			</div>
		</div>
			`;
		// this._create('tr', this.tbody, '<td colspan="99"> searching...</td>', ["loadingRow"]);
		this.filter = filter;
		this._fetchPageOfData(this.filter, 0);
	}

	_fetchNextPage() {
		if (this.fetchingNextPage) return;
		this.fetchingNextPage = true;
		let t = this;
		this._fetchPageOfData(this.filter, this.pageIndex + 1, () => {
			t.fetchingNextPage = false;
		});
	}

	_fetchPageOfData(filter, pageIndex, callback) {

		if (pageIndex > 0 && this.endReached) return;
		let pageSize = 50;
		this.pageIndex = pageIndex;
		let options = {
			filter: filter
			, sort: this.sort
			, page: pageIndex
			, pageSize: pageSize
		};

		this.searchOptions = options;
		buildfire.appData.search(options, this.tag, (e, results) => {
			if (e && callback) return callback(e);
			this.tbody.innerHTML = '';
			this.endReached = results.length < pageSize;
			this.endReached = results[0] && results[0].data.length ? results.length < pageSize : true;
			if (results[0] && results[0].data.length)  {
				this.tbody.classList.remove('text-center', 'padded')
				this.items = results[0].data
				results[0].data.forEach(r => this.renderRow({ data: r }))
			} else {
				this.tbody.classList.add('text-center', 'padded')
				// this.tbody.innerHTML = 'No results.';
				this.tbody.innerHTML = `<div class="empty-state">
				<h4 class="text-center" style="font-size:16px; line-height:22px;">No Results</h4>
				<br>
			</div>`;
			}
			if (callback) callback();
		});
	}

	_onCommand(obj, tr, command) {
		if (this.commands[command]) {
			this.commands[command](obj, tr)
		} else {
			console.log(`Command ${command} does not have any handler`);
		}
	}

	renderRow(obj, tr) {
		if (tr) //used to update a row
			tr.innerHTML = '';
		else
			tr = this._create('tr', this.tbody);
		tr.setAttribute("objId", obj.id);
		this.config.columns.forEach(colConfig => {
			let classes = [];
			if (colConfig.type == "date")
				classes = ["text-left"];
			else if (colConfig.type == "number")
				classes = ["text-right"];
			else classes = ["text-left"];
			var td;
			if (colConfig.type == "command") {
				td = this._create('td', tr, '<button class="btn btn-link">' + colConfig.data + '</button>', ["editColumn"]);
				td.onclick = (event) => {
					event.preventDefault();
					this._onCommand(obj, tr, colConfig.command);
				};
			} else {
				var output = ""
				try {
					///needed for the eval statement next
					var data = obj.data;
					output = eval("`" + colConfig.data + "`");
				} catch (error) {
					console.log(error);
				}
				if(colConfig.type === 'date') {

					let d = new Date(obj.data.reportedAt)
					var datestring = ("0"+(d.getMonth()+1)).slice(-2) + "/" + ("0" + d.getDate()).slice(-2) + "/" +
    				d.getFullYear() + " " + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
					output = datestring
				}
				td = this._create('td', tr, output, classes);
				if(colConfig.command) {
					td.onclick = (event) => {
						event.preventDefault();
						this._onCommand(obj, tr, colConfig.command);
					};
				}
			}
			if (colConfig.width)
				td.style.width = colConfig.width;

		});

		let t = this;
		if (this.config.options.showEditButton) {
			let td = this._create('td', tr, '<button class="btn btn--icon"><span class="icon icon-pencil"></span></button>', ["editColumn"]);
			td.onclick = () => {
				t.onEditRow(obj, tr);
			};
		}

		if (this.config.options.showDeleteButton) {
			let td = this._create('td', tr, '<button class="btn btn--icon"><span class="icon icon-cross2"></span></button>', ["editColumn"]);
			td.onclick = () => {
				buildfire.notifications.confirm({
					title: "Are you sure?"
					, message: "Are you sure to delete this record?"
					, confirmButton: { text: 'Yes', key: 'yes', type: 'danger' }
					, cancelButton: { text: 'No', key: 'no', type: 'default' }
				}, function (e, data) {
					if (e) console.error(e);

					if (data.selectedButton.key == "yes") {
						tr.classList.add("hidden");
						buildfire.appData.update(obj.id, { $set: { deletedOn: new Date() } }, this.tag, e => {
							if (e)
								tr.classList.remove("hidden");
							else
								t.onRowDeleted(obj, tr);
						});

					}
				});

			};
		}
		this.onRowAdded(obj, tr);
	}

	onSearchSet(options) {
		return options;
	}
	onRowAdded(obj, tr) { }

	onEditRow(obj, tr) {
		console.log("Edit row", obj);
	}

	onRowDeleted(obj, tr) {
		console.log("Record Delete", obj);
	}

	onCommand(command, cb) {
		this.commands[command] = cb;
	}

	_create(elementType, appendTo, innerHTML, classNameArray) {
		let e = document.createElement(elementType);
		if (innerHTML) e.innerHTML = innerHTML;
		if (Array.isArray(classNameArray))
			classNameArray.forEach(c => e.classList.add(c));
		if (appendTo) appendTo.appendChild(e);
		return e;
	}


}
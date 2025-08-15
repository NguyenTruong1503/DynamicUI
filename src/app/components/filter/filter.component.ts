import { Component, inject, OnInit, viewChild, AfterViewInit } from '@angular/core';
import { FormsModule, NgForm } from "@angular/forms";
import { NgxDatatableModule } from "@siemens/ngx-datatable";
import { ModuleService } from '../../services/module-service.service';
import { firstValueFrom } from 'rxjs';
import { NgClass, NgForOf, NgIf } from '@angular/common';
import { DropDownListModule } from "@syncfusion/ej2-angular-dropdowns";
import { FilterSettingsModel, GridModule, ToolbarItems } from "@syncfusion/ej2-angular-grids";
import { DEFAULT_PAGE_OPTIONS } from '../../shared/constants';
import { TranslatePipe } from '@ngx-translate/core';
import {ToastComponent} from '../../shared/toast/toast.component';


@Component({
  selector: 'app-filter',
  standalone: true,
  imports: [
    FormsModule,
    NgxDatatableModule,
    NgClass,
    NgIf,
    DropDownListModule,
    GridModule,
    TranslatePipe,
    ToastComponent
  ],
  templateUrl: './filter.component.html',
  styleUrl: './filter.component.scss'
})
export class FilterComponent implements OnInit, AfterViewInit {
  listFilters: any[] = [];
  listScreens: any = []
  listModals: any[] = [];
  listStyles: any[] = [];
  listParameters: any = [];
  // Biến xử lý hiển thị trên checkbox
  processedFilters: any[] = [];
  listFilterByModal: any[] = [];
  valueFilter: any = {
    FilterCode: "",
    FilterName: "",
    ParameterCode: "",
    StyleCode: ""
  }
  valueFilterBody: any = {};
  valueSelectedRow: any = {};
  valueSelectedScreen: string = '';
  valueSelectedModal: string = '';
  is_Check_Update: boolean = false;
  isCheckboxChanging: boolean = false;
  is_CheckUpdateFilterModal: boolean = false;

  // Các biển của Grid Data
  gridConfig: any = {
    dataSource: [], //data dể hiển thị
    dataGridHeader: [], // Header
    query: {}, // điều kiện để lọc dữ liệu
    // rowHeight: '27', // chiều cao của row
    // gridHeight: '100%',//Math.ceil((window.innerHeight - 370) / 2), // chiều cao của grid
    // gridWidth: '100%', // chiều dài của grid

    enableHover: false, // bật/tắt sự kiện khi hover vào row
    enableHeaderFocus: false, // bật/tắt chọn focus vào thẻ header
    enableVirtualization: false, // bật/tắt hiệu ứng không hiển thị dữ liệu khi scroll nhanh

    allowReordering: false, // bật/tắt cho phép đổi vị trí cột
    allowSorting: true, // bật/tắt sắp xếp trên header
    sortSettings: {
      columns: [
        { field: 'displayOrder', direction: 'Descending' },
        {field: 'isUpdated', direction: 'Descending' },
      ]
    },
    allowFiltering: true, // bật/tắt lọc trên header
    allowGrouping: true, // bật/tắt gom nhóm dữ liệu trên header
    allowSelection: true, // bật/tắt chọn dòng dữ liệu
    allowResizing: false,
    allowPaging: false,

    allowTextWrap: true,
    textWrapSettings: { wrapMode: 'Content' },

    showColumnMenu: true, // bật/tắt hiển thị menu action trên header
    autoFit: true,

    editSettings: null, // Chỉnh sửa
    toolbar: [], // ['Add', 'Edit', 'Delete', 'Update', 'Cancel'] nếu cần

    loadingIndicator: { indicatorType: 'Spinner' }, // cấu hình hiệu ứng load row dữ liệu
    selectionSettings: { type: 'Single', persistSelection: false },//{ type: 'Single', checkboxMode: 'ResetOnRowClick', mode: 'Row' }, // cấu hình chọn row dữ liệu
    filterSettings: { type: "Menu" }, // cấu hình giao diện hiển thị filter
    groupSettings: { showGroupedColumn: true }, // cấu hình gom nhóm dữ liệu trên header
    pageSettings: { pageCount: 10, pageSize: 100 },

    // Có thể thêm tùy chọn mở rộng ở đây nếu cần:
    expandOnClick: true,
    allowExcelExport: false,
    allowPdfExport: false,
  }

  public filterSetting!: FilterSettingsModel;
  public buttonToolbar: ToolbarItems[] = ['Search']
  pageOptions = DEFAULT_PAGE_OPTIONS;

  // Service
  dataService = inject(ModuleService);

  // Toast
  valueToast: any = {
    message: "",
    showToast: false,
    type: "info",
    action: "create"
  }

  readonly formFilter = viewChild.required<NgForm>('f');
  readonly grid = viewChild.required<any>('grid');

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.grid && this.grid().element) {
        const gridElement = this.grid().element;
        gridElement.style.height = '400px';
        gridElement.style.minHeight = '400px';

        // Force refresh grid
        if (this.grid().refresh) {
          this.grid().refresh();
        }
      }
    }, 200);
  }
  async ngOnInit(): Promise<void> {
    this.filterSetting = {
      type: 'CheckBox'
    }
    await this.Filters_GetList();
    this.processFiltersDisplay();
    await this.Screens_GetList();
    await this.Style_GetList();
    await this.Parameter_GetList();
  }

  async onSubmit() {
    if (this.is_Check_Update) {
      this.valueToast.action = 'update';
    } else {
      this.valueToast.action = 'create';
    }
    await this.Filter_InsertUpdate(this.valueFilter);
    this.onClear(this.formFilter())
  }

  onClear(f: NgForm) {
    this.valueFilter = {
      FilterID: 0,
      FilterCode: "",
      FilterName: "",
      ParameterCode: "",
      StyleCode: ""
    }
    f.resetForm();
    this.is_Check_Update = false;
    this.grid().clearSelection();
  }

  //Hàm xử lý sự kiện khi click vào row
  onActivate(e: any) {
    const rowData = e.data;
    this.valueFilter = { ...rowData };
    this.valueSelectedRow = rowData;
    this.is_Check_Update = true;
  }

  rowDeselected(args: any) {
    this.onClear(this.formFilter());
  }


  // Hàm xử lý lấy stt
  getRowIndex(data: any) {
    const currentPage = this.grid().pageSettings?.currentPage ?? 1;
    const pageSize = this.grid().pageSettings?.pageSize ?? 10;
    return (currentPage - 1) * pageSize + (+data.index + 1);
  }

  // Hàm xử lý lưu tạm check box đã chọn
  onCheckboxChange(row: any, event: any) {
    const isChecked = event.target.checked;
    this.is_CheckUpdateFilterModal = true;

    if (isChecked) {
      // Cập nhật trạng thái - Tạo array mới
      this.processedFilters = this.processedFilters.map(filter => {
        if (filter.FilterID === row.FilterID) {
          // Tự động gán DisplayOrder tiếp theo
          let newDisplayOrder = 1;
          if ((this.valueSelectedModal && this.listFilterByModal.length > 0) || (this.valueSelectedModal && this.processedFilters.length > 0)) {
            const maxDisplayOrder = Math.max(
              0,
              ...this.processedFilters.map(f => f.displayOrder)
            );
            newDisplayOrder = maxDisplayOrder + 1;
          }

          return {
            ...filter,
            isSelected: true,
            isNewlyAdded: true,
            displayOrder: newDisplayOrder
          };
        }
        return filter;
      });

    } else {
      // Cập nhật trạng thái - Tạo array mới
      this.processedFilters = this.processedFilters.map(filter => {
        if (filter.FilterID === row.FilterID) {
          if (row.isInModal) {
            return {
              ...filter,
              isSelected: false,
              isNewlyAdded: false,
              displayOrder: 0,
              isUpdated: true,
            }
          }
          return {
            ...filter,
            isSelected: false,
            isNewlyAdded: false,
            displayOrder: 0
          };
        }
        return filter;
      });
    }
    console.log("111111", this.processedFilters)
  }

  // Thêm class vào row
  rowDataBound(args: any) {
    const data = args.data;
    const row = args.row as HTMLElement;
    if (data.isUpdated) {
      row.classList.add('filter-updated');
    } else if (data.isInModal && !data.isNewlyAdded ) {
      row.classList.add('filter-in-modal');
    } else if (data.isNewlyAdded) {
      row.classList.add('filter-newly-added');
    } else {
      row.classList.add('filter-default');
    }
  }

  // Hàm xử lý thay đổi DisplayOrder
  onDisplayOrderChange(row: any, event: any) {
    this.is_CheckUpdateFilterModal = true;
    const newValue = parseInt(event.target.value) || 0;

    this.processedFilters = this.processedFilters.map(filter => {
      if (filter.FilterID === row.FilterID) {
        if (filter.isInModal) {
          return {
            ...filter,
            displayOrder: newValue,
            isUpdated: true,
          };
        }
        return {
          ...filter,
          displayOrder: newValue,
        };
      }
      return filter;
    });
  }

  // Hàm xử lý delete
  async onDeleteRow() {
    let valueDelele = { ...this.valueFilter, IsDelete: 1 };
    this.valueToast.action = 'Delete';
    await this.Filter_InsertUpdate(valueDelele);
    this.onClear(this.formFilter());
  }

  // Hàm xử lý Clear checkbox
  async onResetCheckBox() {
    await this.onChangeModalSearchFilter(this.valueSelectedModal);
    this.is_CheckUpdateFilterModal = false;
  }

  // Hàm xử lý ngModelChange của Screen
  async onChangeScreenSearchModal(value: any) {
    if (value) {
      await this.Modal_GetByScreen({ ScreenID: value });
      if (Object.keys(this.listModals).length > 0) {
        this.valueSelectedModal = this.listModals[0]?.ModalID;
        await this.onChangeModalSearchFilter(this.valueSelectedModal);
      } else {
        this.listFilterByModal = [];
        this.processFiltersDisplay();
      }
    } else {
      await this.Filters_GetList();
      this.valueSelectedModal = '';
    }
    this.is_CheckUpdateFilterModal = false;
  }

  // Hàm xử lý ngModalChange của Modal
  async onChangeModalSearchFilter(value: any) {
    if (value) {
      await this.Filters_GetList({ ScreenID: this.valueSelectedScreen, ModalID: this.valueSelectedModal });
    } else {
      await this.Filters_GetList();
    }
  }

  // Hàm xử lý xem có modal được chọn hay không
  hasModalSelected() {
    return this.valueSelectedModal !== '';
  }

  // Hàm xử lý Insert Filter cho modal đã chọn
  async onInsetUpdateFilterOfModal() {
    const dataInput = this.processedFilters.filter(filter => filter.isSelected  || filter.isNewlyAdded );
    console.log("value ",dataInput);
    // this.normalizeDisplayOrder(dataInput);
    const dataFilter = dataInput.map(f => ({
      FilterID: f.FilterID,
      DisplayOrder: f.displayOrder
    }));
    await this.FilterOfModal_InsertUpdate({ ModalID: this.valueSelectedModal }, { Filter: dataFilter });
    this.is_CheckUpdateFilterModal = false;
  }

  // Hàm xử lý GetList cho Filter
  async Filters_GetList(body: any = {}) {
    this.valueFilterBody = { ...body };
    const storedName = 'sp_Filter_GetList';
    const tableName = 'ListFilters';
    try {
      const res = await firstValueFrom(this.dataService.StoredDynamic_Exec({ DataInput: this.valueFilterBody }, storedName, tableName));
      if (res.resultCode == 'OK' && res.result) {
        if (Object.keys(this.valueFilterBody).length === 0) {
          this.listFilters = res.result.ListFilters || [];
          this.listFilterByModal = [];
          this.processFiltersDisplay();
        } else {
          this.listFilterByModal = res.result.ListFilters || [];
          this.processFiltersDisplay();
        }
      }
    } catch (e: any) {
      console.error(e);
    }
  }

  // Hàm xử lý gọi GetList cho Screen
  async Screens_GetList(body: any = {}) {
    this.valueFilterBody = { ...body };
    const storedName = 'sp_Screen_GetList';
    const tableName = 'ListScreens';
    try {
      const res = await firstValueFrom(this.dataService.StoredDynamic_Exec({ DataInput: this.valueFilterBody }, storedName, tableName));
      if (res.resultCode == 'OK' && res.result) {
        this.listScreens = res.result.ListScreens || [];
      }
    } catch (e: any) {
      console.error(e);
    }
  }

  // Hàm xử lý gọi List Modal By Screen
  async Modal_GetByScreen(body: any = {}) {
    this.valueFilterBody = { ...body };
    const storedName = 'sp_Modal_GetByScreen';
    const tableName = 'ListModals_GetByScreen';
    try {
      const res = await firstValueFrom(this.dataService.StoredDynamic_Exec({ DataInput: this.valueFilterBody }, storedName, tableName));
      if (res.resultCode == 'OK' && res.result) {
        this.listModals = res.result.ListModals_GetByScreen || [];
      }
    }
    catch (e: any) {
      console.error(e);
    }
  }

  // Hàm xử lý Get List cho Style Css
  async Style_GetList(body: any = {}) {
    this.valueFilterBody = { ...body };
    const storedName = 'sp_CssStyle_GetList';
    const tableName = 'ListStyles';
    try {
      const res = await firstValueFrom(this.dataService.StoredDynamic_Exec({ DataInput: this.valueFilterBody }, storedName, tableName));
      if (res.resultCode == 'OK' && res.result) {
        this.listStyles = res.result.ListStyles || [];
      }
    } catch (e: any) {
      console.error(e);
    }
  }

  // Hàm xử lý GetList cho parameter
  async Parameter_GetList(body: any = {}) {
    this.valueFilterBody = { ...body };
    const storeName = 'sp_Parameter_GetList';
    const tableName = 'ListParameters';
    try {
      const res = await firstValueFrom(this.dataService.StoredDynamic_Exec({ DataInput: this.valueFilterBody }, storeName, tableName));
      if (res.resultCode == 'OK' && res.result) {
        this.listParameters = res.result.ListParameters || [];
      }
    } catch (e: any) {
      console.error(e);
    }
  }

  // Hàm xử lý Insert Update cho Filter
  async Filter_InsertUpdate(body: any = {}) {
    this.valueFilterBody = { ...body };
    const storedName = 'sp_Filter_InsertUpdate';
    const tableName = 'ListInsertUpdate';
    try {
      const res = await firstValueFrom(this.dataService.StoredDynamic_Exec({ DataInput: this.valueFilterBody }, storedName, tableName));
      if (res.resultCode == 'OK' && res.result) {
        // Cấu hình toast
        let msg = '';
        if (this.valueToast.action === 'create'){
          msg = 'Tạo filter thành công.'
        } else if (this.valueToast.action === 'update'){
          msg = "Cập nhật filter thành công."
        } else {
          msg = "Xoá filter thành công."
        }
        let status = res.result.ListInsertUpdate[0].ErrorStatus;

        if (status == 1) {
          msg = res.result.ListInsertUpdate[0]?.ErrorMessage ;
        } else {
          // Load lại danh sách
          if (this.valueSelectedModal){
            await this.Filters_GetList();
            await this.Filters_GetList({ ScreenID: this.valueSelectedScreen, ModalID: this.valueSelectedModal });
          }else {
            await this.Filters_GetList();
          }
        }
        this.showToast(msg, status)
      }
    } catch (e: any) {
      console.error(e);
    }
  }

  // Hàm xử lý Insert Update Filter cho Modal đã chọn
  async FilterOfModal_InsertUpdate(body: any = {}, filter: any = []) {
    this.valueFilterBody = { ...body };
    console.log("valueFilterBody", this.valueFilterBody);
    const storedName = "sp_FilterOfModal_InsertUpdate";
    const tableName = 'ListFilterOfModals_InsertUpdate';
    try {
      const res = await firstValueFrom(this.dataService.StoredDynamic_Exec({ DataInput: this.valueFilterBody, Filters: filter }, storedName, tableName));
      if (res.resultCode == 'OK' && res.result) {
        await this.Filters_GetList({ ScreenID: this.valueSelectedScreen, ModalID: this.valueSelectedModal });
      }
    } catch (e: any) {
      console.error(e);
    }
  }

  // Hàm xử lý hiển thị filter với trạng thái
  processFiltersDisplay() {
    this.processedFilters = this.listFilters.map(filter => {
      const modalFilter = this.listFilterByModal.find(mf => mf.FilterID === filter.FilterID);
      if (modalFilter) {
        return {
          ...filter,
          isSelected: true,
          isInModal: true,
          displayOrder: modalFilter.DisplayOrder,
          isNewlyAdded: false,
          isUpdated: false,
        }
      } else {
        return {
          ...filter,
          isSelected: false,
          displayOrder: 0,
          isNewlyAdded: false,
          isUpdated: false,
        }
      }
    })
  }

  // Hàm xử lý sắp xếp displayOrder
  // public normalizeDisplayOrder(list: any[]) {
  //   // Lọc ra những item có DisplayOrder > 0 và sắp xếp theo DisplayOrder hiện tại
  //   const validItems = list.filter(item => item.displayOrder > 0);
  //   const sorted = validItems.sort((a, b) => {
  //     if (a.displayOrder === b.displayOrder){
  //       return a.FilterCode.localeCompare(b.FilterCode);
  //     }
  //     return a.displayOrder - b.displayOrder
  //   });
  //
  //   // Gán lại thứ tự từ 1 đến n cho những item hợp lệ
  //   sorted.forEach((item, index) => {
  //     item.displayOrder = index + 1;
  //   });
  // }

  showToast(msg: string, err:number = 0) {
    if (err){
      this.valueToast.type = 'danger';
      this.valueToast.showToast = true;
      this.valueToast.message = msg;
    } else {
      this.valueToast.type = 'success';
      this.valueToast.showToast = true;
      this.valueToast.message = msg;
    }
  }

}

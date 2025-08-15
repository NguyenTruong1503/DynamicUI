import {Component, inject, OnDestroy, OnInit, TemplateRef, viewChild} from '@angular/core';
import {FormsModule, NgForm, ReactiveFormsModule} from "@angular/forms";
import {NgxDatatableModule, TableColumn} from "@siemens/ngx-datatable";
import {ModuleService} from '../../services/module-service.service';
import {debounceTime, distinctUntilChanged, firstValueFrom, Subject, takeUntil} from 'rxjs';
import {NgClass, NgForOf, NgIf} from '@angular/common';
import {DropDownListModule} from "@syncfusion/ej2-angular-dropdowns";
import {FilterSettingsModel, GridModule, ToolbarItems} from "@syncfusion/ej2-angular-grids";
import {DEFAULT_PAGE_OPTIONS} from '../../shared/constants';
import {TranslatePipe} from '@ngx-translate/core';


@Component({
  selector: 'app-gridheader',
  standalone: true,
  imports: [
    FormsModule,
    NgxDatatableModule,
    ReactiveFormsModule,
    NgClass,
    NgIf,
    DropDownListModule,
    GridModule,
    TranslatePipe
  ],
  templateUrl: './gridheader.component.html',
  styleUrl: './gridheader.component.scss'
})
export class GridheaderComponent implements OnInit{
  listGridHeaders : any[] = [];
  listScreens: any[] = [];
  listModalByScreen: any[] = [];
  listParameters: any = [];
  listStyles : any = [];
  listSelectedCheckBox: any[] = [];
  listGridHeaderOfModal: any[] = [];
  listProcessGridHeaders: any[] = [];

  valueGridHeader: any = {
    HeaderCode: "",
    HeaderName: "",
    ParameterCode: "",
    StyleCode: ''
  };
  valueGridHeaderBody: any = {};
  valueSelectedRow: any = {};
  valueSelectedScreen: string = '';
  valueSelectedModal: string = '';
  is_Check_Update: boolean = false;
  is_CheckUpdateGridHeaderOfModal: boolean = false;

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
    sortSettings: {
      columns: [
        {
          field: "DisplayOrder", direction: "desc",
        },
        {
          field: "isUpdated", direction: "desc",
        }
      ]
    },
    pageSettings: { pageCount: 10, pageSize: 100 },

    // Có thể thêm tùy chọn mở rộng ở đây nếu cần:
    expandOnClick: true,
    allowExcelExport: false,
    allowPdfExport: false,
  }
  public filterSetting!: FilterSettingsModel;
  public buttonToolbar: ToolbarItems[] = ['Search']
  pageOptions = DEFAULT_PAGE_OPTIONS;

  //Service
  dataService =inject(ModuleService);

  readonly formGridHeader = viewChild.required<NgForm>('f');
  readonly grid = viewChild.required<any>('grid');

  async ngOnInit(): Promise<void> {
    this.filterSetting = {type: 'CheckBox'}
    await this.GridHeader_GetList();
    await this.Screens_GetList();
    await this.Style_GetList();
    await this.Parameter_GetList();
  }

  hasChooseModal() {
    return !(this.valueSelectedModal === '' || this.valueSelectedModal === undefined);
  }

  // Hàm tạo và update Grid Header ở giao diện
  async onSubmit(){
    await this.GridHeader_InsertUpdate(this.valueGridHeader);
    this.onClear(this.formGridHeader());
  }

  // Hàm lưu insert update GridHeader cho modal
  async onSaveGridHeaderOfModal() {
    this.is_CheckUpdateGridHeaderOfModal = false;
    const data = this.listProcessGridHeaders.filter(item => item.isUpdated || item.isNewlyAdded || (item.isInModal && item.isSelected));
    // this.normalizeDisplayOrder(data);
    const dataInput = data.map((item) => ({
      GridHeaderID: item.GridHeaderID,
      DisplayOrder: item.DisplayOrder,
    }))
    await this.GridHeader_InsertUpdateOfModal({ModalID: this.valueSelectedModal}, {GridHeader: dataInput});
  }

  // Hàm làm mới form
  onClear(f: NgForm){
    this.valueGridHeader= {
      GridHeaderID: 0,
      HeaderCode: "",
      HeaderName: "",
      ParameterCode: "",
      StyleCode: ''
    };
    f.resetForm()
    this.is_Check_Update = false;
    this.grid().clearSelection();
  }

  //Hàm xử lý sự kiện click khi chọn row
  onActivate(e: any){
    const rowData = e.data;
    this.valueGridHeader = {...rowData};
    this.is_Check_Update = true;
    console.log("rowData", rowData);
  }

  onDeActivate(e: any){
    this.onClear(this.formGridHeader());
  }

  async onResetGridHeaderOfModal() {
    await this.GridHeader_GetList({ScreenID: this.valueSelectedScreen, ModalID: this.valueSelectedModal});
    this.is_CheckUpdateGridHeaderOfModal = false;
  }

  // Hàm xử lý thêm class vào các trạng thái select update
  rowDataBound(e: any) {
    const data = e.data;
    const row = e.row as HTMLElement;
    if (data.isUpdated) {
      row.classList.add('filter-updated')
    } else if (data.isInModal && !data.isNewlyAdded) {
      row.classList.add('filter-in-modal');
    } else if (data.isNewlyAdded) {
      row.classList.add('filter-newly-added')
    }else {
      row.classList.add('filter-default')
    }
  }

  // Hàm xử lý lấy stt
  getRowIndex (data: any) {
    const currentPage = this.grid().pageSettings?.currentPage ?? 1;
    const pageSize = this.grid().pageSettings?.pageSize ?? 10;
    return (currentPage - 1) * pageSize + (+data.index + 1);
  }

  // Hàm xử lý lưu check box được chọn
  onCheckboxChange(row: any, event: any) {
    const isChecked = event.target.checked;
    this.is_CheckUpdateGridHeaderOfModal = true;
    this.listProcessGridHeaders = this.listProcessGridHeaders.map((header: any) => {
      if (header.GridHeaderID === row.GridHeaderID) {
        if (isChecked) {
          let newDisplayOrder = 1;
          const maxDisplayOrder = Math.max(0, ...this.listProcessGridHeaders.map((i: any) => i.DisplayOrder));
          newDisplayOrder = maxDisplayOrder + 1;
          return {
            ...header,
            isNewlyAdded: true,
            DisplayOrder: newDisplayOrder,
            isSelected: true,
          }
        }else {
          if (header.isInModal) {
            return {
              ...header,
              isUpdated: true,
              DisplayOrder: 0,
              isSelected: false,
              isNewlyAdded: false,
            }
          } else {
            return {
              ...header,
              DisplayOrder: 0,
              isSelected: false,
              isNewlyAdded: false,
            }
          }
        }
      }
      return header;
    })
  }

  // Hàm xử lý sự kiện thay đổi display order
  onChangeDisplayOrder(row: any, event: any) {
    this.is_CheckUpdateGridHeaderOfModal = true;
    const displayOrder = event.target.value;
    this.listProcessGridHeaders = this.listProcessGridHeaders.map((header: any) => {
      if (header.GridHeaderID === row.GridHeaderID) {
        if (row.isInModal) {
          return {
            ...header,
            DisplayOrder: displayOrder,
            isUpdated: true,
          }
        }
        else {
          return {
            ...header,
            DisplayOrder: displayOrder
          }
        }
      }
      return header;
    })
  }

  // Hàm xử lý sự kiện khi screen thay đổi
  async onChangeScreen(value: any){
    if (value) {
      await this.Modal_GetByScreen({ScreenID: value});
      this.valueSelectedModal = this.listModalByScreen[0]?.ModalID;
      await this.onChangeModal(this.valueSelectedModal)
    }else {
      await this.GridHeader_GetList();
      this.valueSelectedModal = '';
    }
  }

  // Hàm xử lý sự kiện khi modal thay đổi
  async onChangeModal(value: any) {
    if (value) {
      await this.GridHeader_GetList({ScreenID: this.valueSelectedScreen, ModalID: this.valueSelectedModal});
    } else {
      await this.GridHeader_GetList();
    }
  }

  // Hàm xử lý delete row
  async onDeleteRowSelected () {
    let valueRowDeleted = {...this.valueGridHeader, IsDelete: 1};
    await this.GridHeader_InsertUpdate(valueRowDeleted);
    this.onClear(this.formGridHeader());
  }

  // Hàm xử lý GetList cho GridHeader
  async GridHeader_GetList(body: any = {}){
    this.valueGridHeaderBody = {...body};
    const storedName  = 'sp_GridHeader_GetList';
    const tableName = 'ListGridHeaders'
    try {
      const res = await firstValueFrom(this.dataService.StoredDynamic_Exec({DataInput: this.valueGridHeaderBody}, storedName, tableName));
      if (res.resultCode == 'OK' && res.result) {
        if (Object.keys(this.valueGridHeaderBody).length === 0) {
          this.listGridHeaders = res.result.ListGridHeaders;
          this.listGridHeaderOfModal = [];
          this.processGridHeaderDisplay();
        } else {
          this.listGridHeaderOfModal = res.result.ListGridHeaders;
          this.processGridHeaderDisplay();
        }
      }
    }catch (e: any){
      console.error(e);
    }
  }

  // Hàm xử lý gọi GetList cho Screen
  async Screens_GetList(body: any = {}) {
    this.valueGridHeaderBody = {...body};
    const storedName  = 'sp_Screen_GetList';
    const tableName = 'ListScreens';
    try {
      const res = await firstValueFrom(this.dataService.StoredDynamic_Exec({DataIndex: this.valueGridHeaderBody}, storedName, tableName));
      if (res.resultCode == 'OK' && res.result) {
        this.listScreens = res.result.ListScreens;
      }
    }catch (e: any){
      console.error(e);
    }
  }

  // Hàm xử lý gọi GetList cho Modal
  async Modal_GetByScreen(body: any = {}){
    this.valueGridHeaderBody = {...body};
    const storedName = 'sp_Modal_GetByScreen';
    const tableName = 'ListModalByScreen';
    try {
      const res = await firstValueFrom(this.dataService.StoredDynamic_Exec({DataInput: this.valueGridHeaderBody}, storedName, tableName));
      if (res.resultCode == 'OK' && res.result) {
        this.listModalByScreen = res.result.ListModalByScreen || [];
      }
    }catch (e: any){
      console.error(e);
    }
  }

  // Hàm xử lý Get List cho Style Css
  async Style_GetList(body: any = {}) {
    this.valueGridHeaderBody = {...body};
    const storedName = 'sp_CssStyle_GetList';
    const tableName = 'ListStyles';
    try {
      const res = await firstValueFrom(this.dataService.StoredDynamic_Exec({DataInput: this.valueGridHeaderBody}, storedName, tableName));
      if (res.resultCode == 'OK' && res.result) {
        this.listStyles = res.result.ListStyles || [];
      }
    }catch (e: any) {
      console.error(e);
    }
  }

  // Hàm xử lý GetList cho parameter
  async Parameter_GetList(body: any = {}) {
    this.valueGridHeaderBody = {...body};
    const storeName = 'sp_Parameter_GetList';
    const tableName = 'ListParameters';
    try {
      const res = await firstValueFrom(this.dataService.StoredDynamic_Exec({DataInput: this.valueGridHeaderBody}, storeName, tableName));
      if (res.resultCode == 'OK' && res.result){
        this.listParameters = res.result.ListParameters || [];
      }
    }catch (e: any) {
      console.error(e);
    }
  }

  // Hàm xử lý Insert Update cho Grid Header
  async GridHeader_InsertUpdate(body: any = {}) {
    this.valueGridHeaderBody = {...body};
    const storedName = 'sp_GridHeader_InsertUpdate';
    const tableName = 'ListInsertUpdate';
    try {
      const res = await firstValueFrom(this.dataService.StoredDynamic_Exec({DataInput: this.valueGridHeaderBody}, storedName, tableName));
      if (res.resultCode == 'OK' && res.result) {
        await this.GridHeader_GetList();
        await this.GridHeader_GetList({ScreenID: this.valueSelectedScreen, ModalID: this.valueSelectedModal});
      }
    }catch (e: any) {
      console.error(e);
    }
  }

  // Hàm xử lý Insert Update GridHeader cho Modal
  async GridHeader_InsertUpdateOfModal(body: any = {}, GridHeaders: any = []) {
    this.valueGridHeaderBody = {...body};
    const storedName = 'sp_GridHeaderOfModal_InsertUpdate';
    const tableName = 'ListInsertUpdateOfModal';
    try {
      const res = await firstValueFrom(this.dataService.StoredDynamic_Exec({DataInput: this.valueGridHeaderBody, GridHeaders: GridHeaders}, storedName, tableName));
      if (res.resultCode == 'OK' && res.result) {
        await this.GridHeader_GetList({ScreenID: this.valueSelectedScreen, ModalID: this.valueSelectedModal});
      }
    }catch (e: any){
      console.error(e);
    }
  }

  // Hàm xử lý thêm các thuộc tính isSelect, isUpdate, isNewlyAdded cho GridHeader
  processGridHeaderDisplay() {
    this.listProcessGridHeaders = this.listGridHeaders.map((item: any) => {
      const gridHeaderModal = this.listGridHeaderOfModal.find(header => header.GridHeaderID === item.GridHeaderID );
      if (gridHeaderModal) {
        return {
          ...item,
          isSelected: true,
          isInModal: true,
          DisplayOrder: gridHeaderModal.DisplayOrder,
          isNewlyAdded: false,
          isUpdated: false,
        }
      }else {
        return {
          ...item,
          isSelected: false,
          isInModal: false,
          DisplayOrder: 0,
          isNewlyAdded: false,
          isUpdated: false,
        }
      }
    })
  }

  // Hàm xử lý sắp xếp displayOrder
  // public normalizeDisplayOrder(list: any[]) {
  //   // Lọc ra những item có DisplayOrder > 0 và sắp xếp theo DisplayOrder hiện tại
  //   // const validItems = list.filter(item => item.DisplayOrder > 0);
  //   const sorted = list.sort((a, b) => {
  //     if (a.DisplayOrder === b.DisplayOrder){
  //       return a.HeaderCode.localeCompare(b.HeaderCode);
  //     }
  //     return a.DisplayOrder - b.DisplayOrder
  //   });
  //
  //   // Gán lại thứ tự từ 1 đến n cho những item hợp lệ
  //   sorted.forEach((item, index) => {
  //     item.DisplayOrder = index + 1;
  //   });
  // }
}

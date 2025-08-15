import {Component, inject, OnDestroy, OnInit, TemplateRef, viewChild} from '@angular/core';
import {NgxDatatableModule, TableColumn} from "@siemens/ngx-datatable";
import {FormsModule, NgForm, ReactiveFormsModule} from '@angular/forms';
import {NgClass, NgForOf, NgIf} from '@angular/common';
import {ModuleService} from '../../services/module-service.service';
import {debounce, debounceTime, distinctUntilChanged, firstValueFrom, Subject, takeUntil} from 'rxjs';
import {DropDownListAllModule} from '@syncfusion/ej2-angular-dropdowns';
import {FilterSettingsModel, GridAllModule, ToolbarItems} from '@syncfusion/ej2-angular-grids';
import {ej} from "@syncfusion/ej2/dist/ej2";
import {DEFAULT_PAGE_OPTIONS} from '../../shared/constants';
import {TranslatePipe} from '@ngx-translate/core';


@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [
    NgxDatatableModule,
    FormsModule,
    NgForOf,
    NgIf,
    ReactiveFormsModule,
    NgClass,
    DropDownListAllModule,
    GridAllModule,
    TranslatePipe
  ],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss'
})
export class ModalComponent implements OnInit {
  listModal: any[] = [];
  listScreen: any[] = [];
  listScreenWithAll: any[] = [];
  listStyleCss: any[] = [];
  valueModal: any = {
    ScreenID: '',
    ModalID: 0,
    ModalCode: "",
    ModalName: "",
    Type: "",
    IsActive: false,
    DisplayOrder: null,
    Description: null,
    Numerical: null,
    ImageIcon: null,
    StyleCode: null
  };
  valueModalBody: any = {};
  valueSelectedRow: any = {};
  valueSearchByScreen: number = 0;
  is_Check_Update: boolean = false;

  // Biến cho Grid Data
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
    pageSettings: { pageCount: 10, pageSize: 100 },

    // Có thể thêm tùy chọn mở rộng ở đây nếu cần:
    expandOnClick: true,
    allowExcelExport: false,
    allowPdfExport: false,
  }
  public filterSetting!: FilterSettingsModel;
  modalToolbar: ToolbarItems[] = ['Search'];
  pageOptions = DEFAULT_PAGE_OPTIONS;

  // Service
  dataService = inject(ModuleService);

  readonly formModal = viewChild.required<NgForm>('f');
  readonly grid = viewChild.required<any>('grid');

  async ngOnInit(): Promise<void> {
    this.filterSetting = {type: 'CheckBox'};
    await this.Modal_GetList();
    await this.Screen_GetList();
    await this.StyleCss_GetList();
    this.listScreenWithAll = [
      {ScreenID: 0, ScreenName: 'Chọn tất cả Screen'},
      ...this.listScreen
    ]
  }

  // Hàm xử lý tạo mới, update Modal
  async onInsertUpdate() {
    await this.Modal_Insert_Update(this.valueModal);
    this.onClear(this.formModal());
  }

  // Hàm xử lý làm mới form
  onClear(f: NgForm) {
    this.valueModal = {ModalID: 0};
    console.log('value', this.valueModal);
    f.resetForm()
    this.is_Check_Update = false;
    this.grid().clearSelection();
  }

  // Hàm xử lý chọn row
  onActivate(e: any) {
    const rowData = e.data;
    this.valueModal = {...rowData};
    this.is_Check_Update = true;
  }

  // Hàm xử lý xoá modal
  async onDeleteModal() {
    const valueModalDelete = {...this.valueModal,IsDelete: 1}
    await this.Modal_Insert_Update(valueModalDelete);
    this.onClear(this.formModal());
  }

  // Hàm xử lý lọc theo screen
  async onChangeByScreen(e: any) {
    console.log('onChangeByScreen', e);
    if (e === 0) {
      await this.Modal_GetList();
    } else {
      await this.Modal_GetList({ScreenID: e});
    }
  }

  // Hàm xử lý STT bằng phân trang
  getRowIndex(data: any){
    const currentPage = this.grid().pageSettings?.currentPage ?? 1;
    const pageSize = this.grid().pageSettings?.pageSize ?? 10;
    return (currentPage - 1) * pageSize + (+data.index) + 1
  }

  // ******* Các hàm xử lý API **************

  // Hàm xử lý GetList cho Modal
  async Modal_GetList(body: any = {}) {
    this.valueModalBody = {...body};
    const storedName = 'sp_Modal_GetByScreen';
    const tableName = 'ListModal';
    try {
      const res = await firstValueFrom(this.dataService.StoredDynamic_Exec({DataInput: this.valueModalBody}, storedName, tableName));
      if (res.resultCode == 'OK' && res.result) {
        this.listModal = res.result.ListModal;
      }
    } catch (err: any) {
      console.error(err);
    }
  }

  // Hàm xử lý GetList cho Screen
  async Screen_GetList(body: any = {}) {
    const storedName = 'sp_Screen_GetList';
    const tableName = 'ListScreen';
    try {
      const res = await firstValueFrom(this.dataService.StoredDynamic_Exec({DataInput: this.valueModalBody}, storedName, tableName));
      if (res.resultCode == 'OK' && res.result) {
        this.listScreen = res.result.ListScreen;
      }
    } catch (err: any) {
      console.error(err);
    }
  }

  // Hàm xử lý GetList cho StyleCss
  async StyleCss_GetList(body: any = {}) {
    this.valueModalBody = {...body};
    const storedName = "sp_CssStyle_GetList";
    const tableName = "ListStyleCss"
    try {
      const res = await firstValueFrom(this.dataService.StoredDynamic_Exec({DataInput: this.valueModalBody}, storedName, tableName));
      if (res.resultCode == "OK" && res.result) {
        this.listStyleCss = res.result.ListStyleCss;
      }
    } catch (err: any) {
      console.error(err);
    }
  }

  // Hàm Insert Update cho Modal
  async Modal_Insert_Update(body: any = {}) {
    this.valueModalBody = {...body};
    const storedName = 'sp_Modal_InsertUpdate';
    const tableName = 'Modal_InsertUpdate';
    try {
      const res = await firstValueFrom(this.dataService.StoredDynamic_Exec({DataInput: this.valueModalBody}, storedName, tableName));
      if (res.resultCode == 'OK' && res.result) {
        await this.Modal_GetList();
      }
    }catch (err: any) {
      console.error(err);
    }
  }

}

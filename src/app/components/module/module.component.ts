// module.component.ts
import {Component, ElementRef, inject, OnDestroy, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {NgxDatatableModule} from '@siemens/ngx-datatable';
import {CommonModule} from '@angular/common';
import {ModuleService} from '../../services/module-service.service';
import {firstValueFrom} from 'rxjs';
import {FormsModule, NgForm} from '@angular/forms';
import {ConfirmModalComponent} from '../../shared/confirm-modal/confirm-modal.component';
import {ToastComponent} from '../../shared/toast/toast.component';
import {
  FilterSettingsModel,
  GridAllModule,
  GroupSettings,
  GroupSettingsModel,
  ToolbarItems
} from '@syncfusion/ej2-angular-grids';
import {DropDownListAllModule} from '@syncfusion/ej2-angular-dropdowns';
import {DEFAULT_PAGE_OPTIONS} from '../../shared/constants';
import {TranslatePipe} from '@ngx-translate/core';


@Component({
  selector: 'app-module',
  standalone: true,
  imports: [
    CommonModule,
    NgxDatatableModule,
    FormsModule,
    ConfirmModalComponent,
    ToastComponent,
    GridAllModule,
    DropDownListAllModule,
    TranslatePipe
  ],
  templateUrl: './module.component.html',
  styleUrl: './module.component.scss'
})
export class ModuleComponent implements OnInit {

  private moduleService = inject(ModuleService)

  @ViewChild('f', {static: true}) fComponent!: NgForm;
  @ViewChild('successToast', {static: false}) successToast!: ElementRef;
  @ViewChild('grid', {static: true}) grid!: any;

  private valueModuleBody = {};
  is_check_update = false;
  listModules: any[] = [];
  valueModule = {
    RowIndex: 0,
    ModuleID: 0,
    ModuleCode: "",
    ModuleName: "",
    IsActive: false,
    IsCheckRole: false,
    ImageIcon: null,
    DisplayOrder: null,
    Description: null,
    ParentID: null,
    Path: null,
    Level: 0
  }
  selectedRow: any;

  // Các biến toast
  contentToast: string = '';
  showToast: boolean = false;
  typeToast: 'success' | 'danger' | 'info' | 'warning' = 'success';

  // Biến Confirm Modal
  showConfirmModal = false;

  // Biến trong grid data
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
  public groupOptions !: GroupSettingsModel;
  public filterSettings!: FilterSettingsModel;
  public gridToolbar: ToolbarItems[] = ['Search'];
  pageOptions = DEFAULT_PAGE_OPTIONS;

  async ngOnInit(): Promise<void> {
    this.groupOptions = {showGroupedColumn: true};
    this.filterSettings = {type: 'CheckBox'};
    await this.Modules_GetAll();
  }

  // Hàm xử lý chọn row và cập nhật valueModule
  onActivate(event: any) {
    const rowData = event.data;
    this.valueModule = {...rowData};
    this.selectedRow = rowData;
    this.is_check_update = true;
  }

  // Hàm xử lý huỷ chọn row
  onDeSelected(row: any) {
    this.onClear(this.fComponent)
  }

  // Hàm xử lý tạo mới module
  async onSubmit() {
    await this.Module_Insert(this.valueModule);
    this.showSuccessToast("Tạo Module thành công.");
    this.onClear(this.fComponent)
  }

  // Hàm xử lý cập nhật module
  async onUpdate() {
    if (this.valueModule.ModuleID !== 0) {
      await this.Module_Insert(this.valueModule);
      this.showSuccessToast('Cập nhật thành công.');
      this.onClear(this.fComponent);
    }
  }

  // Nhấn Làm mới
  onClear(f: NgForm) {
    this.valueModule = {
      RowIndex: 0,
      ModuleID: 0,
      ModuleCode: "",
      ModuleName: "",
      IsActive: false,
      IsCheckRole: false,
      ImageIcon: null,
      DisplayOrder: null,
      Description: null,
      ParentID: null,
      Path: null,
      Level: 0
    }
    f.resetForm();
    this.is_check_update = false;
    this.grid.clearSelection();
  }


  onDeleteClick() {
    this.showConfirmModal = true;
  }

  // Hàm xử lý xoá module
  async onDeleteModule() {
    let valueModuleDelete = {...this.valueModule, IsDelete: 1}
    await this.Module_Insert(valueModuleDelete);
    this.showSuccessToast("Xoá thành công."); // Hiện toast khi thành công
    this.onClear(this.fComponent);
  }

  async handleDeleteConfirmed() {
    this.showConfirmModal = false;
    await this.onDeleteModule();
  }

  // Hàm lấy toàn bộ Module
  async Modules_GetAll(body: any = {}) {
    this.valueModuleBody = {...body};
    const storedName = 'sp_Module_GetList';
    const tableName = 'ListModules';
    try {
      const res = await firstValueFrom(this.moduleService.StoredDynamic_Exec({DataInput: this.valueModuleBody}, storedName, tableName));
      if (res.resultCode == 'OK' && res?.result) {
        this.listModules = res?.result.ListModules || [];
      }
    } catch (err: any) {
      console.error(err);
    }
  }

  // Hàm Insert Update delete Module
  async Module_Insert(body: any = {}) {
    this.valueModuleBody = {...this.valueModuleBody, ...body};
    const storedName = 'sp_Module_Insert';
    const tableName = 'ValueModule, ListModules';

    try {
      const res = await firstValueFrom(
        this.moduleService.StoredDynamic_Exec(
          {DataInput: this.valueModuleBody},
          storedName,
          tableName
        )
      );
      if (res.resultCode == 'OK' && res?.result) {
        await this.Modules_GetAll();
      }
    } catch (err: any) {
      console.error(err);
    }
  }

  showSuccessToast(contentToast: string) {
    this.contentToast = contentToast;
    this.showToast = true;
  }

  showErrorToast(contentToast: string) {
    this.contentToast = contentToast;
    this.showToast = true;
    this.typeToast = 'danger';
  }

  protected readonly toolbar = toolbar;
}

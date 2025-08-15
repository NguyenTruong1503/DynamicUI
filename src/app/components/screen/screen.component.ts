import {Component, inject, OnDestroy, OnInit, TemplateRef, viewChild} from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { NgClass, NgForOf, NgIf } from '@angular/common';
import { NgxDatatableModule, TableColumn } from '@siemens/ngx-datatable';
import {debounceTime, distinctUntilChanged, firstValueFrom, Subject, takeUntil} from 'rxjs';
import { ModuleService } from '../../services/module-service.service';
import {ToastComponent} from '../../shared/toast/toast.component';
import {DropDownListAllModule} from '@syncfusion/ej2-angular-dropdowns';
import {FilterSettingsModel, GridAllModule, ToolbarItems} from '@syncfusion/ej2-angular-grids';
import {DEFAULT_PAGE_OPTIONS} from '../../shared/constants';
import {TranslatePipe} from '@ngx-translate/core';


@Component({
  selector: 'app-screen',
  standalone: true,
  imports: [
    FormsModule,
    NgForOf,
    NgClass,
    NgIf,
    NgxDatatableModule,
    ToastComponent,
    DropDownListAllModule,
    GridAllModule,
    TranslatePipe
  ],
  templateUrl: './screen.component.html',
  styleUrl: './screen.component.scss'
})
export class ScreenComponent implements OnInit {
  readonly formScreen = viewChild.required<NgForm>('f');
  readonly grid = viewChild.required<any>('grid');

  // Service
  moduleService = inject(ModuleService);

  listScreen: any[] = [];
  listModules: any[] = [];
  listModulesWithAll: any[] = [];
  valueScreenBody = {}
  valueSearchByModule: string = '';
  valueSelectedRow: any = {};
  is_Check_Update: boolean = false;

  // Biến của Grid Data
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
  screenToolbar: ToolbarItems[] = ['Search']
  pageOptions = DEFAULT_PAGE_OPTIONS;

  // Toast
  contentToast: string = '';
  showToast: boolean = false;
  typeToast: 'success' | 'danger' | 'info' | 'warning' = 'success';

  valueScreen: any = {
    RowIndex: null,
    ScreenID: 0,
    ScreenCode: "",
    ScreenName: "",
    Type: "",
    IsActive: true,
    IsCheckRole: false,
    ImageIcon: null,
    Description: null,
    Numerical: null,
    ModuleCode: null,
  }

  async ngOnInit(): Promise<void> {
    this.filterSetting = {type:'CheckBox'}
    await this.getAllScreens();
    await this.getAllModules();
    this.listModulesWithAll = [
      { ModuleCode: '', ModuleName: 'Chọn tất cả Module'},
      ... this.listModules
    ];
  }

  // Hàm xử lý Insert Update cho Screen
  async onInsertUpdate() {
    await this.Screen_Insert_Update(this.valueScreen);
    this.onClear(this.formScreen())
  }

  // Hàm xử lý lọc theo Module
  async onChangeModule(selectedModule: string) {
    if (selectedModule == "") {
      await this.getAllScreens();
    } else {
      await this.getAllScreens({ModuleCode: selectedModule});
    }
  }

  // Hàm clear input trong form
  onClear(form: NgForm) {
    this.valueScreen = {
      RowIndex: null,
      ScreenID: 0,
      ScreenCode: "",
      ScreenName: "",
      Type: "",
      IsActive: true,
      IsCheckRole: false,
      ModuleID: "",
      ImageIcon: null,
      Description: null,
      Numerical: null,
      ModuleCode: null
    }
    form.resetForm();
    this.is_Check_Update = false;
    this.grid().clearSelection();
  }

  // Hàm chọn row trong table
  onActivate(e: any) {
    const rowData = e.data;
    this.valueScreen = {...rowData};
    this.is_Check_Update = true;
  }

  // Hàm xử lý Delete Screen
  async onDeleteScreen() {
    let valueDeleteScreen = {...this.valueScreen, IsDelete: 1};
    console.log("valueDeleteScreen", valueDeleteScreen);
    await this.Screen_Insert_Update(valueDeleteScreen);
    this.onClear(this.formScreen())
  }

  // Hàm lấy List Screens
  async getAllScreens(body: any = {}) {
    this.valueScreenBody = { ...body };
    const storedName = 'sp_Screen_GetList';
    const tableName = 'ListScreen';
    try {
      const res = await firstValueFrom(this.moduleService.StoredDynamic_Exec({ DataInput: this.valueScreenBody }, storedName, tableName));
      if (res.resultCode == 'OK' && res?.result) {
        this.listScreen = res.result.ListScreen || [];
      }
      else {
        console.log("ScreenData", this.listScreen);
      }
    } catch (error) {
      console.error(error);
    }
  }

  // Hàm lấy List Modules
  async getAllModules(body: any = {}) {
    const storedName = 'sp_Module_GetList';
    const tableName = 'ListModules';
    try {
      const res = await firstValueFrom(this.moduleService.StoredDynamic_Exec({DataInput: body}, storedName, tableName));
      if (res.resultCode == 'OK' && res?.result) {
        this.listModules = res.result.ListModules || [];
      }
    } catch (error) {
      console.error(error);
    }
  }

  onChangeMode(e: any) {
    const selectedItem = e.itemData;
    this.valueScreen.ModuleCode = selectedItem.ModuleCode;
    this.valueScreen.ModuleID = selectedItem.ModuleID;
    console.log('Selected Module:', selectedItem);
  }

  // Hàm Insert Update
  async Screen_Insert_Update(body: any = {}) {
    this.valueScreenBody = {...body };
    const storedName = 'sp_Screen_InsertUpdate';
    const tableName = 'StatusScreen';
    try {
      const res = await firstValueFrom(this.moduleService.StoredDynamic_Exec({DataInput: body}, storedName, tableName));
      if (res.resultCode == 'OK' && res.result){
        await this.getAllScreens();
        if (Object.keys(res.result).length === 0 || res?.result?.StatusScreen[0]?.ErrorStatus == 0 ){
          if (Object.keys(res.result).length === 0){
            this.showToastScreen('success', 'Xoá Screen thành công.')
          } else  if (res?.result?.StatusScreen[0]?.ErrorStatus == 0) {
            this.showToastScreen('success', res?.result?.StatusScreen[0]?.ErrorMessage + ' thành công.')
          }
        }else {
          this.showToastScreen('danger', 'Thông báo thất bại.')
        }
      }
    }catch (error) {
      console.error(error);
    }
  }

  showToastScreen(typeToast:'success' | 'danger' | 'info' | 'warning', content:string){
    this.typeToast = typeToast;
    this.showToast = true;
    this.contentToast = content;
  }


}

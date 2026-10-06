import { Injectable } from '@angular/core';
import { YearKpis, YearReviewTask } from './vhn-year-review.service';

@Injectable({
  providedIn: 'root',
})
export class VhnExcelExportService {
  async exportYearToExcel(
    year: number,
    kpis: YearKpis,
    tasks: YearReviewTask[],
  ): Promise<void> {
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Việc Hôm Nay';
    workbook.created = new Date();

    // Sheet 1: Tổng quan
    const summarySheet = workbook.addWorksheet('Tổng Quan');
    summarySheet.columns = [
      { header: 'Chỉ số', key: 'metric', width: 32 },
      { header: 'Giá trị', key: 'value', width: 24 },
    ];

    const totalHours = (kpis.totalTrackedMs / (1000 * 60 * 60)).toFixed(1);

    summarySheet.addRow({ metric: 'Năm thống kê', value: year });
    summarySheet.addRow({ metric: 'Tổng số công việc đã xong', value: kpis.totalDone });
    summarySheet.addRow({ metric: 'Số ngày có hoạt động', value: `${kpis.activeDays} ngày` });
    summarySheet.addRow({ metric: 'Chuỗi ngày liên tục dài nhất', value: `${kpis.longestStreak} ngày` });
    summarySheet.addRow({ metric: 'Tổng thời gian đã làm việc', value: `${totalHours} giờ` });

    // Format header row
    summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    summarySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF10B981' },
    };

    // Sheet 2: Danh sách công việc
    const detailSheet = workbook.addWorksheet('Chi Tiết Công Việc');
    detailSheet.columns = [
      { header: 'Ngày hoàn thành', key: 'doneOn', width: 18 },
      { header: 'Tên công việc', key: 'title', width: 45 },
      { header: 'Thời gian (phút)', key: 'minutes', width: 18 },
    ];

    detailSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    detailSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF10B981' },
    };

    tasks.forEach((t) => {
      detailSheet.addRow({
        doneOn: t.doneOn,
        title: t.title,
        minutes: Math.round(t.timeSpent / (1000 * 60)),
      });
    });

    // Write buffer and trigger browser download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Viec-Hom-Nay-${year}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}

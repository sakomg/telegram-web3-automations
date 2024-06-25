const baseHeaders = ['Number', 'Account', 'User', 'BalanceBefore', 'BalanceAfter'];

const reportHeaders = {
  hamster: {
    headers: [...baseHeaders, 'ProfitPerHour'],
  },
  blum: {
    headers: [...baseHeaders, 'Tickets'],
  },
  iceberg: {
    headers: baseHeaders,
  },
};

export default class ReportGenerator {
  generateReport = (gameType, data) => {
    const { headers } = reportHeaders[gameType];
    const csvContent = this.jsonToCSV(data, headers);
    return Buffer.from(csvContent, 'utf8');
  };

  jsonToCSV(jsonArray, columns) {
    const csvRows = [];

    csvRows.push(columns.join(','));

    jsonArray.forEach((item) => {
      const row = columns.map((column) => {
        const cell = String(item[column] || '').replace(/"/g, '""');
        return `"${cell}"`;
      });
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }
}

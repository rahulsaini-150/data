import Entry from "../models/Entry.js";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import moment from "moment";

export const createEntry = async (req, res) => {
  try {
    const { date, route, km, petrolFillDate, rupee } = req.body;
    const payload = { date, route, km, rupee };
    if (petrolFillDate) payload.petrolFillDate = petrolFillDate;
    const entry = new Entry(payload);
    await entry.save();
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getEntries = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      fromDate,
      toDate,
      sortBy = "createdAt",
      sortDir = "desc",
    } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);

    const filter = {};
    if (search) {
      filter.$or = [
        { route: { $regex: new RegExp(search, "i") } },
      ];
    }
    if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) filter.date.$gte = new Date(fromDate);
      if (toDate) filter.date.$lte = new Date(toDate);
    }

    const sort = { [sortBy]: sortDir === "asc" ? 1 : -1 };

    const [total, totalsAgg, data] = await Promise.all([
      Entry.countDocuments(filter),
      Entry.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalKm: { $sum: "$km" },
            totalRupee: { $sum: "$rupee" },
          },
        },
      ]),
      Entry.find(filter)
        .sort(sort)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;
    const totals = {
      km: totalsAgg[0]?.totalKm || 0,
      rupee: totalsAgg[0]?.totalRupee || 0,
    };

    res.json({ data, page: pageNum, limit: limitNum, total, totalPages, totals });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getEntry = async (req, res) => {
  try {
    const entry = await Entry.findById(req.params.id);
    if (!entry) return res.status(404).json({ message: "Not found" });
    res.json(entry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateEntry = async (req, res) => {
  try {
    const entry = await Entry.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(entry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteEntry = async (req, res) => {
  try {
    await Entry.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Excel export
export const exportExcel = async (req, res) => {
  try {
    const { search = "", fromDate, toDate, sortBy = "createdAt", sortDir = "desc" } = req.query;
    const filter = {};
    if (search) {
      filter.$or = [
        { route: { $regex: new RegExp(search, "i") } },
      ];
    }
    if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) filter.date.$gte = new Date(fromDate);
      if (toDate) filter.date.$lte = new Date(toDate);
    }

    const sort = { [sortBy]: sortDir === "asc" ? 1 : -1 };
    const entries = await Entry.find(filter).sort(sort);
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Entries");

    ws.columns = [
      { header: "S.No", key: "sno", width: 8 },
      { header: "Date", key: "date", width: 16 },
      { header: "Time", key: "time", width: 10 },
      { header: "Route", key: "route", width: 30 },
      { header: "KM", key: "km", width: 10 },
      { header: "Petrol Date", key: "petrolFillDate", width: 16 },
      { header: "Rupee", key: "rupee", width: 12 }
    ];

    // Header styling
    ws.getRow(1).font = { bold: true };
    ws.getRow(1).alignment = { vertical: "middle", horizontal: "center" };
    ws.views = [{ state: "frozen", ySplit: 1 }];

    let totalKm = 0;
    let totalRupee = 0;
    entries.forEach((e, i) => {
      totalKm += Number(e.km) || 0;
      totalRupee += Number(e.rupee) || 0;
      ws.addRow({
        sno: i + 1,
        date: moment(e.date).format("DD MMM YYYY"),
        time: moment(e.createdAt).format("hh:mm A"),
        route: e.route,
        km: e.km,
        petrolFillDate: e.petrolFillDate ? moment(e.petrolFillDate).format("DD MMM YYYY") : "",
        rupee: e.rupee
      });
    });

    // Totals row
    const totalsRow = ws.addRow({ route: "Totals", km: totalKm, rupee: totalRupee });
    totalsRow.font = { bold: true };

    // Auto filter
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1 + entries.length + 1, column: ws.columnCount } };

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="entries.xlsx"`
    );

    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to export Excel" });
  }
};

// PDF export
export const exportPDF = async (req, res) => {
  try {
    const { search = "", fromDate, toDate, sortBy = "createdAt", sortDir = "desc" } = req.query;

    const filter = {};
    if (search) {
      filter.$or = [
        { route: { $regex: new RegExp(search, "i") } },
      ];
    }
    if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) filter.date.$gte = new Date(fromDate);
      if (toDate) filter.date.$lte = new Date(toDate);
    }

    const sort = { [sortBy]: sortDir === "asc" ? 1 : -1 };
    const entries = await Entry.find(filter).sort(sort);

    const doc = new PDFDocument({ margin: 30, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="entries.pdf"`);

    // Pipe the document to response
    doc.pipe(res);

    // Title
    doc.fontSize(18).text("", { align: "center" });
    doc.moveDown();

    // Table header
    const tableTop = 80;
    let y = tableTop;

    const headers = ["S.No", "Date", "Route", "KM", "Petrol Date", "Rupee"];
    const columnPositions = [30, 70, 150, 370, 430, 510];
    const columnWidths =     [30,  80,  200,  50,   70,   60];

    doc.fontSize(12).fillColor("black").font("Helvetica-Bold");
    headers.forEach((header, i) => {
      doc.text(header, columnPositions[i], y, { width: columnWidths[i] });
    });
    y += 18;

    // Draw a line below header
    doc.moveTo(30, y).lineTo(570, y).stroke();
    y += 6;

    // Table rows with wrapping and dynamic height
    doc.font("Helvetica").fontSize(10).fillColor("black");
    const bottomLimit = 760;
    entries.forEach((e, i) => {
      const cells = [
        String(i + 1),
        moment(e.date).format("YYYY-MM-DD"),
        e.route || "",
        String(e.km ?? ""),
        e.petrolFillDate ? moment(e.petrolFillDate).format("YYYY-MM-DD") : "",
        String(e.rupee ?? ""),
      ];

      // Compute row height based on wrapped text
      const heights = cells.map((text, idx) => doc.heightOfString(text, { width: columnWidths[idx] }));
      const rowHeight = Math.max(...heights, 14) + 6; // add small padding

      // Page break if needed
      if (y + rowHeight > bottomLimit) {
        doc.addPage();
        y = tableTop;
        // redraw header on new page
        doc.fontSize(12).font("Helvetica-Bold");
        headers.forEach((header, idx) => {
          doc.text(header, columnPositions[idx], y, { width: columnWidths[idx] });
        });
        y += 18;
        doc.moveTo(30, y).lineTo(570, y).stroke();
        y += 6;
        doc.font("Helvetica").fontSize(10);
      }

      // Render row
      cells.forEach((text, idx) => {
        const align = (idx === 0 || idx === 3 || idx === 5) ? "right" : "left";
        doc.text(text, columnPositions[idx], y, { width: columnWidths[idx], align });
      });

      y += rowHeight;
    });

    // Draw border around table (optional)
    // doc.rect(25, tableTop - 10, 520, y - tableTop + 10).stroke();

    doc.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

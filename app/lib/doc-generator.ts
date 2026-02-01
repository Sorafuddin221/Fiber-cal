import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType, BorderStyle, HeadingLevel } from 'docx';

// Type definitions for results from ManualSeparation.tsx
interface ManualSeparationResult {
  id: number;
  name: string;
  wetWeight: number;
  moistureContent: number; // Percentage
  dryWeight: number;
  percentage: number;
}

// Type definitions for results from ChemicalSeparation.tsx
interface ChemicalSeparationResult {
  name: string;
  dryWeight: number;
  dryPercentage: number;
  conditionedPercentage: number;
}

// Type definitions for results from GarmentsAnalysis.tsx
interface GarmentsAnalysisResult {
  fiberName: string;
  totalWeight: number;
  overallPercentage: number;
}


export async function generateManualSeparationDoc(
  sampleResults: ManualSeparationResult[][],
  averageWithoutMoisture: ManualSeparationResult[],
  averageWithMoisture: ManualSeparationResult[],
  totalDryWeight: number
): Promise<Blob> {
  const children = [
    new Paragraph({
      text: 'Manual Separation Analysis Report',
      heading: HeadingLevel.TITLE,
    }),
    new Paragraph({
      text: `Date: ${new Date().toLocaleDateString()}`,
    }),
    new Paragraph({
      text: ' ', // Empty paragraph for spacing
    }),
  ];

  // Sample-by-sample results
  children.push(new Paragraph({ text: 'Sample-by-Sample Results', heading: HeadingLevel.HEADING_1 }));
  sampleResults.forEach((sample, index) => {
    children.push(new Paragraph({ text: `Sample ${index + 1}`, heading: HeadingLevel.HEADING_2 }));
    const tableRows = [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Fiber Name', bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Wet Weight (g)', bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Moisture (%)', bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Dry Weight (g)', bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Percentage (%)', bold: true })] })] }),
        ],
      })
    ];
    sample.forEach(result => {
      tableRows.push(
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(result.name || 'N/A')] }),
            new TableCell({ children: [new Paragraph(Number(result.wetWeight).toFixed(4))] }),
            new TableCell({ children: [new Paragraph(Number(result.moistureContent).toFixed(4))] }),
            new TableCell({ children: [new Paragraph(result.dryWeight.toFixed(4))] }),
            new TableCell({ children: [new Paragraph(result.percentage.toFixed(4))] }),
          ],
        })
      );
    });
    children.push(new Table({ rows: tableRows, width: { size: 100, type: WidthType.PERCENTAGE } }));
    children.push(new Paragraph(' '));
  });

  // Average results without moisture
  children.push(new Paragraph({ text: 'Average Results (Without Moisture)', heading: HeadingLevel.HEADING_1 }));
  const avgWithoutMoistureRows = [
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Fiber Name', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Avg. Dry Weight (g)', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Avg. Moisture (%)', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Avg. Percentage (%)', bold: true })] })] }),
      ],
    })
  ];
  averageWithoutMoisture.forEach(result => {
    avgWithoutMoistureRows.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph(result.name || 'N/A')] }),
          new TableCell({ children: [new Paragraph(Number(result.dryWeight).toFixed(4))] }),
          new TableCell({ children: [new Paragraph(Number(result.moistureContent).toFixed(4))] }),
          new TableCell({ children: [new Paragraph(result.percentage.toFixed(4))] }),
        ],
      })
    );
  });
  children.push(new Table({ rows: avgWithoutMoistureRows, width: { size: 100, type: WidthType.PERCENTAGE } }));
  children.push(new Paragraph(' '));
  
  // Average results with moisture
  children.push(new Paragraph({ text: 'Average Results (With Moisture)', heading: HeadingLevel.HEADING_1 }));
  const avgWithMoistureRows = [
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Fiber Name', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Avg. Dry Weight (g)', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Avg. Moisture (%)', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Avg. Wet Weight (g)', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Avg. Percentage (%)', bold: true })] })] }),
      ],
    })
  ];
  averageWithMoisture.forEach(result => {
    avgWithMoistureRows.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph(result.name || 'N/A')] }),
          new TableCell({ children: [new Paragraph(Number(result.dryWeight).toFixed(4))] }),
          new TableCell({ children: [new Paragraph(Number(result.moistureContent).toFixed(4))] }),
          new TableCell({ children: [new Paragraph(Number(result.wetWeight).toFixed(4))] }),
          new TableCell({ children: [new Paragraph(result.percentage.toFixed(4))] }),
        ],
      })
    );
  });
  children.push(new Table({ rows: avgWithMoistureRows, width: { size: 100, type: WidthType.PERCENTAGE } }));

  const doc = new Document({
    sections: [{
      properties: {},
      children,
    }],
  });

  return Packer.toBlob(doc);
}

export async function generateChemicalSeparationDoc(
  sampleResults: ChemicalSeparationResult[][],
  averageWithoutMoisture: ChemicalSeparationResult[],
  averageWithMoisture: ChemicalSeparationResult[],
  initialWeight: number
): Promise<Blob> {
  const children = [
    new Paragraph({
      text: 'Chemical Separation Analysis Report',
      heading: HeadingLevel.TITLE,
    }),
    new Paragraph({
      text: `Date: ${new Date().toLocaleDateString()}`,
    }),
    new Paragraph({
      text: `Average Initial Dry Sample Weight: ${initialWeight.toFixed(4)} g`,
    }),
    new Paragraph({
      text: ' ', // Empty paragraph for spacing
    }),
  ];

  // Sample-by-sample results
  children.push(new Paragraph({ text: 'Sample-by-Sample Results', heading: HeadingLevel.HEADING_1 }));
  sampleResults.forEach((sample, index) => {
    children.push(new Paragraph({ text: `Sample ${index + 1}`, heading: HeadingLevel.HEADING_2 }));
    const tableRows = [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Fiber Name', bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Dry Weight (g)', bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Dry %', bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Conditioned %', bold: true })] })] }),
        ],
      })
    ];
    sample.forEach(result => {
      tableRows.push(
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(result.name)] }),
            new TableCell({ children: [new Paragraph(result.dryWeight.toFixed(4))] }),
            new TableCell({ children: [new Paragraph(`${result.dryPercentage.toFixed(4)}%`)] }),
            new TableCell({ children: [new Paragraph(`${result.conditionedPercentage.toFixed(4)}%`)] }),
          ],
        })
      );
    });
    children.push(new Table({ rows: tableRows, width: { size: 100, type: WidthType.PERCENTAGE } }));
    children.push(new Paragraph(' '));
  });

  // Average results without moisture
  children.push(new Paragraph({ text: 'Average Results (Without Moisture)', heading: HeadingLevel.HEADING_1 }));
  const avgWithoutMoistureRows = [
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Fiber Name', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Avg. Dry Weight (g)', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Avg. Dry %', bold: true })] })] }),
      ],
    })
  ];
  averageWithoutMoisture.forEach(result => {
    avgWithoutMoistureRows.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph(result.name)] }),
          new TableCell({ children: [new Paragraph(result.dryWeight.toFixed(4))] }),
          new TableCell({ children: [new Paragraph(`${result.dryPercentage.toFixed(4)}%`)] }),
        ],
      })
    );
  });
  children.push(new Table({ rows: avgWithoutMoistureRows, width: { size: 100, type: WidthType.PERCENTAGE } }));
  children.push(new Paragraph(' '));

  // Average results with moisture
  children.push(new Paragraph({ text: 'Average Results (With Moisture)', heading: HeadingLevel.HEADING_1 }));
  const avgWithMoistureRows = [
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Fiber Name', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Avg. Dry Weight (g)', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Avg. Conditioned %', bold: true })] })] }),
      ],
    })
  ];
  averageWithMoisture.forEach(result => {
    avgWithMoistureRows.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph(result.name)] }),
          new TableCell({ children: [new Paragraph(result.dryWeight.toFixed(4))] }),
          new TableCell({ children: [new Paragraph(`${result.conditionedPercentage.toFixed(4)}%`)] }),
        ],
      })
    );
  });
  children.push(new Table({ rows: avgWithMoistureRows, width: { size: 100, type: WidthType.PERCENTAGE } }));


  const doc = new Document({
    sections: [{
      properties: {},
      children,
    }],
  });

  return Packer.toBlob(doc);
}

export async function generateGarmentsAnalysisDoc(
  sampleResults: GarmentsAnalysisResult[][],
  averageResults: GarmentsAnalysisResult[]
): Promise<Blob> {
  const children = [
    new Paragraph({
      text: 'Garments Analysis Report',
      heading: HeadingLevel.TITLE,
    }),
    new Paragraph({
      text: `Date: ${new Date().toLocaleDateString()}`,
    }),
    new Paragraph({
      text: ' ', // Empty paragraph for spacing
    }),
  ];

  // Sample-by-sample results
  children.push(new Paragraph({ text: 'Sample-by-Sample Results', heading: HeadingLevel.HEADING_1 }));
  sampleResults.forEach((sample, index) => {
    children.push(new Paragraph({ text: `Sample ${index + 1}`, heading: HeadingLevel.HEADING_2 }));
    const tableRows = [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Fiber Name', bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Total Weight (g)', bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Overall Percentage (%)', bold: true })] })] }),
        ],
      })
    ];
    sample.forEach(result => {
      tableRows.push(
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(result.fiberName)] }),
            new TableCell({ children: [new Paragraph(result.totalWeight.toFixed(4))] }),
            new TableCell({ children: [new Paragraph(`${result.overallPercentage.toFixed(4)}%`)] }),
          ],
        })
      );
    });
    children.push(new Table({ rows: tableRows, width: { size: 100, type: WidthType.PERCENTAGE } }));
    children.push(new Paragraph(' '));
  });

  // Average results
  children.push(new Paragraph({ text: 'Average Overall Garment Composition', heading: HeadingLevel.HEADING_1 }));
  const avgRows = [
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Fiber Name', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Avg. Total Weight (g)', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Avg. Overall Percentage (%)', bold: true })] })] }),
      ],
    })
  ];
  averageResults.forEach(result => {
    avgRows.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph(result.fiberName)] }),
          new TableCell({ children: [new Paragraph(result.totalWeight.toFixed(4))] }),
          new TableCell({ children: [new Paragraph(`${result.overallPercentage.toFixed(4)}%`)] }),
        ],
      })
    );
  });
  children.push(new Table({ rows: avgRows, width: { size: 100, type: WidthType.PERCENTAGE } }));

  const doc = new Document({
    sections: [{
      properties: {},
      children,
    }],
  });

  return Packer.toBlob(doc);
}

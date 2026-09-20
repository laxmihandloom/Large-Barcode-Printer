import * as React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Box from '@mui/material/Box';
import LoadingButton from '@mui/lab/LoadingButton';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import BarcodeTemplate1 from './barcodeTemplates/BarcodeTemplate1';
import { BarcodeMetadata, LogConstants } from '../common/constants';
import {
  SIZE_MAPPING,
  LabelDesign,
  generateProductCode,
  ageForSize,
  allAges as listAllAges,
  buildLabels,
  totalCopies
} from '../common/barcode';


// BarcodeTemplate1 renders at this fixed size; createPDF captures at the same
// dimensions, so the two must stay in sync.
const TEMPLATE_WIDTH_PX = 400;
const TEMPLATE_HEIGHT_PX = 600;

// Capture multiplier for html2canvas. The label stock is 75x50mm, so a 2x
// capture of the 400x600 template is ~400dpi across the short edge - already
// beyond what a thermal label printer can resolve. Raising this costs pixels
// (and time) that never reach the paper.
const CAPTURE_SCALE = 2;

export default function PrintBarcodeDialog({ openPrintBarcodeDialog, setOpenPrintBarcodeDialog, barcodeMetadata, setBarcodeMetadata, setAlert }: any) {

  const [settingsTab, setSettingsTab] = React.useState<boolean>(true)
  const [printLoading, setPrintLoading] = React.useState<boolean>(false)
  const [printProgress, setPrintProgress] = React.useState<{ done: number; total: number } | null>(null)
  
  // Initialize year and month with current date for new items
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  // Generate years list (current year ± 10 years)
  const years = React.useMemo(() => {
    return Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);
  }, []);
  
  // Generate months list (1-12)
  const months = React.useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => i + 1);
  }, []);
  
  // Initialize year and month for items that don't have them
  React.useEffect(() => {
    const needsUpdate = barcodeMetadata.some((item: BarcodeMetadata) => 
      !item.selectedYear || !item.selectedMonth
    );
    
    if (needsUpdate) {
      const updatedMetadata = barcodeMetadata.map((item: BarcodeMetadata) => {
        if (!item.selectedYear || !item.selectedMonth) {
          return {
            ...item,
            selectedYear: item.selectedYear || currentYear,
            selectedMonth: item.selectedMonth || currentMonth
          };
        }
        return item;
      });
      setBarcodeMetadata(updatedMetadata);
    }
  }, [barcodeMetadata.length]);

  // Get all unique ages from SIZE_MAPPING
  const allAges = React.useMemo(() => listAllAges(), []);

  // Handle per-item size selection
  const handleItemSizeChange = (itemId: string, sizeLabel: string) => {
    const newBarcodeMetadata = barcodeMetadata.map((item: BarcodeMetadata) => {
      if (item.id === itemId) {
        return { ...item, selectedSize: sizeLabel, selectedAge: ageForSize(sizeLabel) };
      }
      return item;
    });
    setBarcodeMetadata(newBarcodeMetadata);
  };

  // Handle per-item age selection
  const handleItemAgeChange = (itemId: string, age: string) => {
    const newBarcodeMetadata = barcodeMetadata.map((item: BarcodeMetadata) => {
      if (item.id === itemId) {
        return { ...item, selectedAge: age };
      }
      return item;
    });
    setBarcodeMetadata(newBarcodeMetadata);
  };

  // Handle per-item year selection
  const handleItemYearChange = (itemId: string, year: number) => {
    const newBarcodeMetadata = barcodeMetadata.map((item: BarcodeMetadata) => {
      if (item.id === itemId) {
        return { ...item, selectedYear: year };
      }
      return item;
    });
    setBarcodeMetadata(newBarcodeMetadata);
  };

  // Handle per-item month selection
  const handleItemMonthChange = (itemId: string, month: number) => {
    const newBarcodeMetadata = barcodeMetadata.map((item: BarcodeMetadata) => {
      if (item.id === itemId) {
        return { ...item, selectedMonth: month };
      }
      return item;
    });
    setBarcodeMetadata(newBarcodeMetadata);
  };

  // The product code only encodes the purchase date, so every copy of an item
  // shares one code. Caching by item+year+month keeps it stable while the user
  // edits unrelated fields (previously any quantity change reshuffled them all)
  // and makes all copies of an item pixel-identical, which is what lets
  // createPDF rasterize each item only once.
  const codeCache = React.useRef<Record<string, string>>({})
  const codeFor = (id: string, year: number, month: number) => {
    const key = `${id}-${year}-${month}`
    if (!codeCache.current[key]) {
      codeCache.current[key] = generateProductCode(year, month)
    }
    return codeCache.current[key]
  }

  // One entry per selected item - NOT per printed label.
  const labels: LabelDesign[] = React.useMemo(
    () => buildLabels(barcodeMetadata, { year: currentYear, month: currentMonth }, codeFor),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [barcodeMetadata]
  )

  const totalPages = React.useMemo(() => totalCopies(labels), [labels])

  const createPDF = async () => {
    setPrintLoading(true);
    setPrintProgress({ done: 0, total: labels.length });

    try {
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [75, 50]
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let pagesAdded = 0;

      // One capture per distinct label. Copies of the same item are identical,
      // so they reuse the rasterised image instead of re-running html2canvas
      // (which clones the whole document on every call).
      for (let i = 0; i < labels.length; i++) {
        const label = labels[i];

        // Find the actual BarcodeTemplate1 component inside the wrapper
        const barcodeWrapper = document.querySelector("#barcode-" + i) as HTMLElement;
        if (!barcodeWrapper) continue;

        // Get the BarcodeTemplate1 component (the direct child)
        const barcodeComponent = barcodeWrapper.firstElementChild as HTMLElement;
        if (!barcodeComponent) continue;

        const canvas = await html2canvas(barcodeComponent, {
          scale: CAPTURE_SCALE,
          useCORS: true,
          backgroundColor: null, // Remove background to avoid extra spacing
          width: TEMPLATE_WIDTH_PX,
          height: TEMPLATE_HEIGHT_PX,
          x: 0,
          y: 0,
          removeContainer: true, // Remove container margins
          logging: false
        });

        // The template is portrait and the label stock is landscape, so rotate
        // the capture 270 degrees before it goes into the page.
        const rotatedCanvas = document.createElement('canvas');
        const rotatedCtx = rotatedCanvas.getContext('2d');

        rotatedCanvas.width = canvas.height;
        rotatedCanvas.height = canvas.width;

        if (rotatedCtx) {
          rotatedCtx.translate(rotatedCanvas.width / 2, rotatedCanvas.height / 2);
          rotatedCtx.rotate(270 * Math.PI / 180);
          rotatedCtx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
        }

        const img = rotatedCanvas.toDataURL("image/png");

        // Passing a stable alias makes jsPDF embed this image once and
        // reference it from every page that repeats it, so N copies cost one
        // image in the output file rather than N.
        const alias = `label-${label.id}`;
        for (let copy = 0; copy < label.copies; copy++) {
          if (pagesAdded > 0) pdf.addPage();
          pdf.addImage(img, "PNG", 0, 0, pageWidth, pageHeight, alias, "FAST");
          pagesAdded++;
        }

        // Release the capture buffers before the next iteration.
        canvas.width = canvas.height = 0;
        rotatedCanvas.width = rotatedCanvas.height = 0;

        // Yield so the progress indicator can actually paint.
        setPrintProgress({ done: i + 1, total: labels.length });
        await new Promise((resolve) => setTimeout(resolve, 0));
      }

      pdf.autoPrint();
      const blobUrl = pdf.output("bloburl");
      const printWindow = window.open(blobUrl, "_blank");
      if (!printWindow) {
        // Popup blockers are common; fall back to a direct download.
        const link = document.createElement("a");
        link.href = blobUrl as unknown as string;
        link.download = "barcodes.pdf";
        link.click();
      }
    } catch (e) {
      console.error(e);
      setAlert({
        severity: "error",
        message: LogConstants.PRINT_BATCODES_ERROR
      });
    } finally {
      setPrintLoading(false);
      setPrintProgress(null);
    }
  };


  const descriptionElementRef = React.useRef<HTMLElement>(null);
  React.useEffect(() => {
    if (openPrintBarcodeDialog) {
      const { current: descriptionElement } = descriptionElementRef;
      if (descriptionElement !== null) {
        descriptionElement.focus();
      }
    }
  }, [openPrintBarcodeDialog]);

  const handleChangeBarcodeQuantity = (id: any, newQuantity: any) => {
    const newBarcodeMetadata = barcodeMetadata.map((item: BarcodeMetadata) => {
      if (item.id === id) return { ...item, quantity: Number(newQuantity) }
      return item
    })
    setBarcodeMetadata(newBarcodeMetadata)
  }

  // Generate payload for per-item selections
  const generatePayload = () => {
    return barcodeMetadata.map((item: BarcodeMetadata) => ({
      sku: item.sku || item.value,
      id: item.id,
      selectedSize: item.selectedSize || '',
      selectedAge: item.selectedAge || '',
      copies: item.quantity,
      itemName: item.itemName,
      associatedField: item.associatedField,
      value: item.value,
      rate: item.rate,
      mrp: item.mrp
    }));
  };

  // Handle Next button click - validate and proceed to preview
  const handleNext = () => {
    // Check if all items have size and age selected
    const incompleteItems = barcodeMetadata.filter((item: BarcodeMetadata) =>
      !item.selectedSize || !item.selectedAge
    );

    if (incompleteItems.length > 0) {
      setAlert({
        severity: 'warning',
        message: `Please select size and age for all items before proceeding.`
      });
      return;
    }

    // Generate payload and log it (you can send this to your API)
    const payload = generatePayload();
    console.log('Barcode generation payload:', payload);

    setSettingsTab(false);
  };

  return (
    <Dialog
      open={openPrintBarcodeDialog}
      onClose={() => setOpenPrintBarcodeDialog(false)}
      scroll='paper'
      aria-labelledby="scroll-dialog-title"
      aria-describedby="scroll-dialog-description"
      maxWidth="md"
      fullWidth
    >
      <DialogTitle id="scroll-dialog-title">Print Barcode</DialogTitle>
      {
        settingsTab ? (
          <DialogContent dividers>
            <Box sx={{ display: "flex", gap: "1rem", justifyContent: "space-between" }}>
              <Box sx={{ display: "flex", flexDirection: "column" }}>
                <Typography variant="subtitle2" gutterBottom>Associated Template</Typography>
                <Typography variant='subtitle2'><strong>Barcode Template</strong></Typography>
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column" }}>
                <Typography variant="subtitle2" gutterBottom>Associated Field</Typography>
                <Typography variant='subtitle2'><strong>SKU</strong></Typography>
              </Box>
            </Box>
            <Box pt={3} pb={2}>
              <Typography variant="subtitle2" gutterBottom>
                Configure size, age, and product code settings for each item individually below.
              </Typography>
            </Box>
            <Box pt={2}>
              <Box sx={{ display: "flex", gap: "1rem", justifyContent: "space-between" }} pb={2}>
                <Typography variant="overline">Item Details</Typography>
                <Typography variant='overline'>Year & Month</Typography>
                <Typography variant='overline'>Size & Age</Typography>
                <Typography variant='overline'>Copies</Typography>
              </Box>
              {barcodeMetadata
                .map((item: BarcodeMetadata) => (
                  <Box key={item.id} sx={{ display: "flex", gap: "1rem", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                    <Box sx={{ display: "flex", flexDirection: "column", flex: 1 }}>
                      <Typography variant='subtitle2'><strong>{item.itemName}</strong></Typography>
                      <Typography variant="subtitle2" gutterBottom>{item.associatedField}: {item.value}</Typography>
                    </Box>

                    <Box sx={{ display: "flex", flexDirection: "row", gap: 1, minWidth: "200px" }}>
                      <FormControl size="small" sx={{ width: "100px" }}>
                        <InputLabel id={`year-${item.id}`}>Year</InputLabel>
                        <Select
                          labelId={`year-${item.id}`}
                          value={item.selectedYear || currentYear}
                          label="Year"
                          onChange={(e) => handleItemYearChange(item.id, Number(e.target.value))}
                          MenuProps={{
                            PaperProps: {
                              sx: {
                                maxHeight: 300,
                                '&::-webkit-scrollbar': {
                                  width: '6px',
                                },
                                '&::-webkit-scrollbar-track': {
                                  background: '#f1f1f1',
                                },
                                '&::-webkit-scrollbar-thumb': {
                                  background: '#d0d0d0',
                                  borderRadius: '3px',
                                },
                                '&::-webkit-scrollbar-thumb:hover': {
                                  background: '#b0b0b0',
                                },
                                // Firefox
                                scrollbarWidth: 'thin',
                                scrollbarColor: '#d0d0d0 #f1f1f1',
                              },
                            },
                          }}
                        >
                          {years.map((year) => (
                            <MenuItem key={year} value={year}>
                              {year}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl size="small" sx={{ width: "100px" }}>
                        <InputLabel id={`month-${item.id}`}>Month</InputLabel>
                        <Select
                          labelId={`month-${item.id}`}
                          value={item.selectedMonth || currentMonth}
                          label="Month"
                          onChange={(e) => handleItemMonthChange(item.id, Number(e.target.value))}
                          MenuProps={{
                            PaperProps: {
                              sx: {
                                maxHeight: 300,
                                '&::-webkit-scrollbar': {
                                  width: '6px',
                                },
                                '&::-webkit-scrollbar-track': {
                                  background: '#f1f1f1',
                                },
                                '&::-webkit-scrollbar-thumb': {
                                  background: '#d0d0d0',
                                  borderRadius: '3px',
                                },
                                '&::-webkit-scrollbar-thumb:hover': {
                                  background: '#b0b0b0',
                                },
                                // Firefox
                                scrollbarWidth: 'thin',
                                scrollbarColor: '#d0d0d0 #f1f1f1',
                              },
                            },
                          }}
                        >
                          {months.map((month) => (
                            <MenuItem key={month} value={month}>
                              {new Date(2000, month - 1, 1).toLocaleString('default', { month: 'short' })}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>

                    <Box sx={{ display: "flex", flexDirection: "row", gap: 1, minWidth: "300px" }}>
                      <FormControl size="small" sx={{ width: "150px" }}>
                        <InputLabel id={`size-label-${item.id}`}>Size</InputLabel>
                        <Select
                          labelId={`size-label-${item.id}`}
                          value={item.selectedSize || ''}
                          label="Size"
                          onChange={(e) => handleItemSizeChange(item.id, e.target.value)}
                          MenuProps={{
                            PaperProps: {
                              style: {
                                maxHeight: 300,
                              },
                            },
                          }}
                        >
                          {Object.keys(SIZE_MAPPING).map((label) => (
                            <MenuItem key={label} value={label}>
                              {label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl size="small" sx={{ width: "150px" }}>
                        <InputLabel id={`age-${item.id}`}>Age</InputLabel>
                        <Select
                          labelId={`age-${item.id}`}
                          value={item.selectedAge || ''}
                          label="Age"
                          onChange={(e) => handleItemAgeChange(item.id, e.target.value)}
                          MenuProps={{
                            PaperProps: {
                              style: {
                                maxHeight: 300,
                              },
                            },
                          }}
                        >
                          {allAges.map((age) => (
                            <MenuItem key={age} value={age}>
                              {age}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>

                    <TextField
                      id={`copies-${item.id}`}
                      sx={{ width: "80px" }}
                      size='small'
                      type="number"
                      inputProps={{ min: 1, max: 99 }}
                      onChange={(e) => { handleChangeBarcodeQuantity(item.id, e.target.value) }}
                      value={item.quantity}
                      variant="outlined"
                    />
                  </Box>
                ))}
            </Box>
          </DialogContent>
        ) : (
          <DialogContent sx={{
            margin: "0 auto",
            width: 'auto',
            height: 'auto',
            overflowY: labels.length > 1 ? 'auto' : 'hidden',
            overflowX: 'hidden',
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'flex-start',
            gap: 2,
            p: 2
          }}>
            {
              labels.map((label: LabelDesign, index: number) => (
                <React.Fragment key={label.id}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Box
                      id={"barcode-" + index}
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e0e0e0',
                        borderRadius: '4px',
                        padding: '10px',
                        margin: '5px'
                      }}
                    >
                      <BarcodeTemplate1
                        itemName={label.itemName}
                        value={label.value}
                        rate={label.rate}
                        mrp={label.mrp}
                        sizeLabel={label.sizeLabel}
                        sizeCode={label.sizeCode}
                        age={label.age}
                        uniqueCode={label.uniqueCode}
                        sku={label.sku}
                      />
                    </Box>
                    <Typography variant="caption" sx={{ pb: 1 }}>
                      {label.copies} {label.copies === 1 ? 'copy' : 'copies'}
                    </Typography>
                  </Box>
                  {labels.length > 1 && index < labels.length - 1 && (
                    <Box sx={{
                      width: '100%',
                      height: '2px',
                      backgroundColor: '#e0e0e0',
                      margin: '10px 0'
                    }} />
                  )}
                </React.Fragment>
              ))
            }
          </DialogContent>
        )
      }
      {
        settingsTab ? (
          <DialogActions>
            <Button onClick={() => setOpenPrintBarcodeDialog(false)}>Cancel</Button>
            <Button variant='contained' onClick={handleNext}>Next</Button>
          </DialogActions>
        ) : (
          <DialogActions>
            <Typography variant="caption" sx={{ mr: 'auto', pl: 2 }}>
              {printProgress
                ? `Rendering ${printProgress.done} / ${printProgress.total} labels...`
                : `${labels.length} ${labels.length === 1 ? 'label' : 'labels'}, ${totalPages} ${totalPages === 1 ? 'page' : 'pages'}`}
            </Typography>
            <Button onClick={() => setSettingsTab(true)} disabled={printLoading}>Back</Button>
            <LoadingButton variant='contained' onClick={createPDF} loading={printLoading}>Print</LoadingButton>
          </DialogActions>
        )
      }

    </Dialog>
  );
}
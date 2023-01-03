// Show plugin UI
figma.showUI(__html__);
figma.ui.resize(385, 575);

// Process callbacks
figma.ui.onmessage = msg => {
    if (msg.type === 'create-grid') { createGrid(msg); }
    if (msg.type === 'create-columns') { createColumns(msg); }
    if(msg.type === 'cancel') { figma.closePlugin(); }
};

// Send current selection to UI for a contrast check
figma.on("selectionchange", () => {
    const selectedColors : any = {};
    const primaryNode : any = figma.currentPage.selection[0];
    const secondaryNode : any = figma.currentPage.selection[1];
    if(!primaryNode || !secondaryNode || primaryNode.type == 'GROUP' || secondaryNode.type == 'GROUP') {return}
    if(primaryNode.fills[0]) {
        selectedColors.fg = rgbToHex(primaryNode.fills[0]); }
        else { selectedColors.fg = rgbToHex(primaryNode.strokes[0]); }
    if(secondaryNode.fills[0]) { 
        selectedColors.bg = rgbToHex(secondaryNode.fills[0]); }
        else { selectedColors.bg = rgbToHex(secondaryNode.strokes[0]); }
    
    figma.ui.postMessage({ type: 'checkContrast', data: selectedColors});
})

// Grid function
function createGrid(msg:any) {
    const selectedNode: any = figma.currentPage.selection[0];
    if (!selectedNode) { figma.notify('Please select an element'); return; }
    const data = msg.data;
    const gridDirection = data.grid_direction;
    const gridColumns = parseInt(data.grid_columns, 10);
    const gridRows = parseInt(data.grid_rows, 10);
    const gridGutterX = parseInt(data.grid_gutter_x, 10);
    const gridGutterY = parseInt(data.grid_gutter_y, 10);    
    const clonedNodes: any[] = [];
    if(gridDirection == 'vertical') {
        for (let i = 0; i < gridColumns; i++) {
            let clone = selectedNode.clone();
            clone.x = ((clone.width + gridGutterX) * i);
            clonedNodes.push(clone);
        }
    } else if(gridDirection == 'horizontal') {
        for (let i = 0; i < gridRows; i++) {
            let clone = selectedNode.clone();
            clone.y = ((clone.height + gridGutterY) * i);
            clonedNodes.push(clone);
        }
    } else {
        const clonedRows: any[] = [];
        for (let i = 0; i < gridColumns; i++) {
            let clone = selectedNode.clone();
            clone.x = ((clone.width + gridGutterX) * i);
            clonedRows.push(clone);
        }
        const rowGroup = figma.group(clonedRows, selectedNode.parent);
        for (let i = 0; i < gridRows; i++) {
            let clone = rowGroup.clone();
            clone.y = ((clone.height + gridGutterY) * i);
            clonedNodes.push(clone);
        }
        rowGroup.remove();
    }
    const gridGroup = figma.group(clonedNodes, selectedNode.parent);
    gridGroup.x = selectedNode.x;
    gridGroup.y = selectedNode.y;
    figma.notify('Created a grid from "'+selectedNode.name+'"');
    selectedNode.remove();
}

function createColumns(msg:any) {
    const selectedNode: any = figma.currentPage.selection[0];
    if (!selectedNode) { figma.notify('Please select an element'); return; }
    const data = msg.data;
    const gridColumns = parseInt(data.grid_columns, 10);
    const gridGutter = parseInt(data.grid_gutter, 10);
    const clonedNodes: any[] = [];
    const newWidth = (selectedNode.width / gridColumns) - (gridGutter * (gridColumns - 1) / gridColumns);
    for (let i = 0; i < gridColumns; i++) {
        let clone = selectedNode.clone();
        clone.resize(newWidth, selectedNode.height);
        clone.x = ((clone.width + gridGutter) * i);
        clonedNodes.push(clone);
    }
    const gridGroup = figma.group(clonedNodes, selectedNode.parent);
    gridGroup.x = selectedNode.x;
    gridGroup.y = selectedNode.y;
    figma.notify('Created columns from "'+selectedNode.name+'"');
    selectedNode.remove();
}

function rgbToHex(fill:any) {
    if(!fill || !fill.color) { return }
    let r:any = Math.round(fill.color.r * 255).toString(16);
    let g:any = Math.round(fill.color.g * 255).toString(16);
    let b:any = Math.round(fill.color.b * 255).toString(16);

    if (r.length == 1) r = "0" + r;
    if (g.length == 1) g = "0" + g;
    if (b.length == 1) b = "0" + b;

    return r + g + b;
}

function rgbToHsl(fill:any) {
    if(!fill || !fill.color) { return }
    let r:any = Math.round(fill.color.r * 255).toString(16);
    let g:any = Math.round(fill.color.g * 255).toString(16);
    let b:any = Math.round(fill.color.b * 255).toString(16);
    r /= 255;
    g /= 255;
    b /= 255;
    const l = Math.max(r, g, b);
    const s = l - Math.min(r, g, b);
    const h = s
      ? l === r
        ? (g - b) / s
        : l === g
        ? 2 + (b - r) / s
        : 4 + (r - g) / s
      : 0;
    return [
      60 * h < 0 ? 60 * h + 360 : 60 * h,
      100 * (s ? (l <= 0.5 ? s / (2 * l - s) : s / (2 - (2 * l - s))) : 0),
      (100 * (2 * l - s)) / 2,
    ];
};
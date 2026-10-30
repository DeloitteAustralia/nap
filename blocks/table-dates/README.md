# table-dates

Custom **table** block. 

## Authoring (Document Authoring)

Model: `standalone`

Block table: the first row is the header row (column headings, rendered as `th scope="col"`); every following row is a data row. Cells may hold paragraphs and links. Short rows are padded to the widest row's column count. Merged (rowspan) cells: leave the repeated cell empty in the following rows. An empty body cell is merged into the cell above it (rowspan) when every cell to its left in that row is also a continuation, so merges nest inside their group (Assessment type > Year > Period). A group label row whose trailing cells are empty, followed by a continuation row, drops those empty cells (the source's rowspan spacer row). A genuinely blank cell therefore needs a non-empty cell to its left in the same row.

## Supported variations

No variations.

## Universal Editor fields

N/A (Document Authoring project)

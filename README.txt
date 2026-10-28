Weekday Scheduling importer fix

Files in this patch:
- src/services/excelService.ts
- src/context/SchedulingContext.tsx

What it changes:
1. Reads the assigned workbook's "Added On" column as the original request timestamp.
2. Recognises the "Scheduling method" column and extracts the per-round entry.
3. Does not fabricate a Calendly URL when the source only contains a placeholder.
4. Preserves every source row as a separate request, even when candidate/company/round repeat.
5. Uses source sheet + row number to avoid importing the same rows twice.
6. Replaces the initial demo seed data with the workbook data on first import, instead of showing seed data plus imported data.

Install:
Extract this ZIP into the root of your existing project folder and allow it to overwrite the two files.
Then, in Terminal at the project root, run:
  npm run dev

Before importing:
In the app, use Reset Demo Data, then import the original "Scheduling ToDos(1).xlsx".

Important data note:
The supplied workbook contains 515 data rows, but only 17 distinct full-row combinations; 498 rows repeat existing rows. This patch preserves all 515 source rows because the assignment appears to require the source volume. It does not claim those repeated rows are distinct real-world requests. The workbook's scheduling values are placeholders, not working Calendly URLs, so imported requests without real URLs will be marked as blocked exceptions.

#!/bin/bash

output_files=./outputs/*-output.csv

# Reset any existing output file
touch output-responsive.csv
rm -f output-responsive.csv
touch output-responsive.csv

# Loop through all the output files
for f in $output_files; do
  # Find lines that contain "idsurvey" and save them to a new file
  cat $f | grep idsurvey >> output-responsive.csv
done

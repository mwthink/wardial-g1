#!/bin/bash

# Config values
areacode="940"

# This function is called with a phone number to check against
# It will output the phone-number and redirect-target, separated by a comma
function checknumber(){
  redirect_location=$(curl -v \
    -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36" \
    http://g1research.com/${1} 2>&1 | grep "< Location:")
  
  echo "${1},${redirect_location}"
}

# Loop through the possible 1st set of digits (non-zero padded)
for phonestart in {102..999}; do
  # Loop through possible 2nd set of digits (non-zero padded)
  for phoneend in {1000..9999}; do
    # Construct a phone number
    phonenumber="${areacode}${phonestart}${phoneend}"
    echo "Checking ${phonenumber}"
    # Check the phone number, save output to a file
    checknumber ${phonenumber} >> outputs/${phonestart}-output.csv
  done
done


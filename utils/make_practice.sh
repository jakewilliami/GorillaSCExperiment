#! /bin/bash

cd "$(dirname "$(realpath "$(basename "$0")")")/"

for i in $(seq $1); do
	if [ $((i%2)) -eq 0 ]; then
		python3 "utils/make_image_arr.py" P
	else
		python3 "utils/make_image_arr.py" D
	fi
	for f in out/*; do
		[[ "$(basename "$f")" =~ out[[:digit:]].* ]] && continue
		F_END="$(awk -F'/out' '{print $2}'<<< "$f")"
  	    mv "$f" "out/out${i}${F_END}"
	done
done

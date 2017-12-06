#!/usr/bin/env bash

set -e

FILEPATH=$(dirname `realpath $0`)/src/grab_data/download.py
ENVPATH=$(dirname `realpath $0`)/data-viz-env/

echo "It'll grab github's data and can take couple hours."
echo "Do you wanna proceed? (y/n)"
read DECISION

if [[ $DECISION == "y" ]]
    then
        bash bootstrap-python-env.sh
        source $ENVPATH/bin/activate

        for i in 2017-11-{16..30}; do
                echo day: $i
                python3 $FILEPATH $i $i
        done
fi

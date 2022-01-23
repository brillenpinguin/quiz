#!/bin/bash

ng build --output-path docs --base-href /quiz/

cp docs/index.html docs/404.html

git add .

git commit -m "build"
#!/bin/bash

# Exit on error
set -e

echo "Downloading AWS CLI v2..."
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"

echo "Unzipping..."
unzip -q awscliv2.zip

echo "Installing (this requires sudo privileges)..."
sudo ./aws/install

echo "Cleaning up..."
rm -rf aws awscliv2.zip

echo "=================================="
echo "Installation Complete!"
echo "Verify it with: aws --version"
echo "=================================="

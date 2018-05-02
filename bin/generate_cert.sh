#!/usr/bin/env bash
NAME=${1:-server}
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
openssl req \
  -newkey rsa:4096 \
  -days 1001 \
  -nodes \
  -x509 \
  -subj "/C=US/ST=California/L=San Francisco/O=LULZCorp/OU=web/CN=localhost" \
  -extensions SAN \
  -config <( cat $( [[ "Darwin" = "$(uname -s)" ]]  && echo /System/Library/OpenSSL/openssl.cnf || echo /etc/ssl/openssl.cnf  ) \
    <(printf "[SAN]\nsubjectAltName='DNS:localhost'")) \
  -keyout "${DIR}/${NAME}.key" \
  -out "${DIR}/${NAME}.crt"

echo ""
echo "* Generated $NAME.key and $NAME.crt files in local directory"
echo ""

if [[ "$OSTYPE" == "darwin"* ]]; then
  echo "* Installing cert into local Keychain."
  echo "* To see or modify, run 'Keychain Access' app and look in the 'System' Folder"
  sudo security add-trusted-cert -d -p ssl -r trustRoot -k "/Library/Keychains/System.keychain" "${DIR}/${NAME}.crt"
else
  echo "* Please install and trust cert at conf/$NAME.crt"
fi
cd "$DIR" 
if [[ ! -d "${DIR}/../conf/" ]]; then
  mkdir "${DIR}/../conf/"
fi
mv ${NAME}.{key,crt} "${DIR}/../conf/"

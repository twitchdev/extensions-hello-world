function generateFakeCert() {
    const signer = require("selfsigned");
    const attrs = [
        { name: "commonName", value: "localhost" }
    ];
    return signer.generate(attrs, {
        keySize: 2048,
        algorithm: "sha256",
        days: 365,
        extensions: [
            {
                name: "basicConstraints",
                cA: true
            },
            {
                name: "subjectAltName",
                altNames: [
                    {
                        type: 2, // DNS
                        value: "localhost"
                    }
                ]
            }
        ]
    });
}

if (require.main === module) {
    const fs = require("fs");
    const certPath = "./conf/server.crt";
    const keyPath = "./conf/server.key";
    if (!fs.existsSync("./conf")) fs.mkdirSync("./conf");
    if (!fs.existsSync(certPath)) {
        console.log("Generate SSL cert at " + certPath);
        const pems = generateFakeCert();
        fs.writeFileSync(certPath, pems.cert, { encoding: "utf-8" });
        fs.writeFileSync(keyPath, pems.private, { encoding: "utf-8" });
        console.log("Please install the cert into your cert manager found at " + certPath);
    } else {
        console.log("SSL Cert already exists at " + certPath);
    }
}
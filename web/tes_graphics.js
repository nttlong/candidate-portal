var Jimp = require("jimp");
var captcha = (event) => {
    var len = Math.floor(Math.random() * 4) + 4;
    var image = new Jimp(len * 50, 80, 0xFFFFFFFF, function (err, image) {
        var txt = "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM123456789";

        Jimp.loadFont(Jimp.FONT_SANS_32_BLACK).then(function (font) {
            var x = 5;
            var retTxt = "";
            for (var i = 0; i < len; i++) {
                var m = new Jimp(80, 80, 0xFFFFFFFF);
                var index = Math.floor(1 + Math.random() * txt.length);
                var S = txt[index];
                var a = Math.floor((Math.random() > 0.5) ? ((-1) * Math.random() * 25) : (Math.random() * 25));

                m.print(font, 0, 0, S);
                m.rotate(a, true);

                var dx = x - Math.sin(a) * 32 + 10;
                var dy = - Math.cos(a) * 32 + 10;
                x += 40;
                m.posterize(Math.random() * 100);
                m.sepia();
                if (Math.random() > 0.5) {
                    m.invert();
                    image.blit(m, x, 0);

                }
                else {
                    image.composite(m, x, 0);
                }


                retTxt += S;
            }
            image.write("./app_data/captcha/x03.png", e => {
                console.log(retTxt);
            })
        });
    });
}



'use strict'

const Helpers = use("Helpers");

const fs = require('fs');
const md5 = require('md5');
const { Document, Packer, Paragraph, Media, TextRun, TextWrappingType } = require('docx');

class FormController {
  async index({ view }) {
    return view.render('index');
  }
  async store({ request, response, session }) {
    response.implicitEnd = false;
    const { placeholder1, placeholder2, placeholder3 } = request.all();
    const imageName = md5(new Date().getTime());

    if(request.file('image')) {
      const image = request.file('image', {
        types: ['image'],
        size: '2mb'
      })

      await image.move(Helpers.tmpPath('imgs'), {
        name: `${imageName}.jpg`,
        overwrite: true
      });

      if(!image.moved()) {
        session.withErrors({ image: "A imagem não suportada servidor!" }).flashAll();
        return response.redirect("back");
      } else {
        const doc = new Document();
        const img = Media.addImage(doc, fs.readFileSync(Helpers.tmpPath(`imgs/${imageName}.jpg`, 350, 150, {
          wrap: {
            type: TextWrappingType.TOP_AND_BOTTOM,
            side: TextWrappingType.BOTH_SIDES
          }
        })));
        const text1 = new TextRun({ text: placeholder1, bold: false});
        const text2 = new TextRun({ text: placeholder2, bold: false});
        const text3 = new TextRun({ text: placeholder3, bold: false});
        doc.addSection({
          children: [
            new Paragraph({
                children: [ text1.break().break().break(),
                text2.break().break().break(),
                text3.break().break().break(),
                img.break().break().break()
                ],
            })
          ]
        })

        Packer.toBase64String(doc).then((string) => {
          const b64string = string;
          response.header('Content-Disposition', `attachment; filename=${imageName}.docx`);
          response.send(Buffer.from(b64string, 'base64'));
          fs.unlinkSync(Helpers.tmpPath(`imgs/${imageName}.jpg`));
        })
      }
    }


  }
}

module.exports = FormController

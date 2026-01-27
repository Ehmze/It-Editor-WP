import {
	ClassicEditor,
	Autosave,
	Essentials,
	Paragraph,
	Heading,
	Bold,
	Italic,
	Link,
	AutoLink,
	ShowBlocks,
	List,
	Underline,
	FontColor,
	BlockQuote,
	GeneralHtmlSupport,
	BalloonToolbar,
	PasteFromOffice,
	Style,
  RemoveFormat
} from 'ckeditor5';

const STYLE_CLASSES = ['divColorBlu','divColorYlw','pBeforeUl','exempleTextItalic','ulFleche','ulFlecheCount','surlignJaune','surlignBleu'];
const LICENSE_KEY = 'GPL'; 
const editorConfig = {
	toolbar: {
		items: [
			'undo','redo','|',
			'showBlocks','|',
			'heading','|',
			'bold','italic','underline','fontColor','|',
      'bulletedList','numberedList','blockQuote','|',
      'removeFormat','style'
		],
		shouldNotGroupWhenFull: false
	},
	plugins: [
		AutoLink,
		Autosave,
		BalloonToolbar,
		BlockQuote,
		Bold,
		Essentials,
		FontColor,
		GeneralHtmlSupport,
		Heading,
		Italic,
		Link,
		List,
		Paragraph,
		ShowBlocks,
		Underline, 
		PasteFromOffice,
		Style,
  	RemoveFormat
	],
	htmlSupport: { // GeneralHtmlSupport
		allow: [
			{name: 'p', classes: STYLE_CLASSES },
			{name: 'span', classes: STYLE_CLASSES}
		]
	},
	balloonToolbar: ['bold', 'italic', '|','fontColor', '|', 'link', '|', 'bulletedList', 'numberedList'],
	heading: {
    options: [
      { model: 'paragraph', title: 'Paragraphe' },
      { model: 'heading2', view: 'h2', title: 'H2' },
      { model: 'heading3', view: 'h3', title: 'H3' },
      { model: 'heading4', view: 'h4', title: 'H4' },
      { model: 'heading5', view: 'h5', title: 'H5' }
    ]
	},
	style: {
		definitions: [
			{ name: 'Div bleu', element: 'p', classes: ['divColorBlu']},
			{ name: 'Div jaune', element: 'p', classes: ['divColorYlw']},
			{ name: 'pBeforeUl', element: 'p', classes: ['pBeforeUl']},
			{ name: 'exempleTextItalic', element: 'span', classes: ['exempleTextItalic']},
			{ name: 'ulFleche', element: 'ul', classes: ['ulFleche']},
			{ name: 'ulFlecheCount', element: 'ul', classes: ['ulFlecheCount']},
			{ name: 'surlignJaune', element: 'span', classes: ['surlignJaune']},
			{ name: 'surlignBleu', element: 'span', classes: ['surlignBleu']}
		]
	},
  link: {
		decorators: {
			addTargetToExternalLinks: {
				mode: 'automatic',
				callback: () => true,
				attributes: {
					target: '_blank',
					rel: 'noopener noreferrer'
				}
			}
  }},
	language: 'fr',
	licenseKey: LICENSE_KEY,
	placeholder: 'Awid le texte',
};

ClassicEditor.create(document.querySelector('#editor'), editorConfig).then(editor => {
  editor.model.document.on('change:data', () => {
    const rawHTML = editor.getData();
    document.getElementById('html-output').textContent =
      prettyHTML(rawHTML);
  });

});

/* ===== HTML SERIALIZER (CLE DU SYSTEME) ===== */
const ALLOWED_ATTRS = { a: ['href', 'target', 'rel']};
function serializeInline(node) {
  let html = '';
  node.childNodes.forEach(child => {
    if (child.nodeType === Node.TEXT_NODE) {html += child.textContent;} 
    else if (child.nodeType === Node.ELEMENT_NODE) {
      const tag = child.tagName.toLowerCase();
		if (
			tag === 'span' &&
			(!child.hasAttribute('class') ||
			!child.getAttribute('class')
				.split(' ').some(cls => STYLE_CLASSES.includes(cls)))
		) {
			html += serializeInline(child); // garde le texte, jette le span
			return;
		}
      let attrs = '';
			// ne garder que les classes autorisées
      if (child.hasAttribute('class')) {
        const classes = child.getAttribute('class')
          .split(' ').filter(cls => STYLE_CLASSES.includes(cls));
        if (classes.length) {attrs += ` class="${classes.join(' ')}"`;}
      }
      if (ALLOWED_ATTRS[tag]) {
        ALLOWED_ATTRS[tag].forEach(attr => {
          if (child.hasAttribute(attr)) {attrs += ` ${attr}="${child.getAttribute(attr)}"`;}
        });
      } 
      html += `<${tag}${attrs}>${serializeInline(child)}</${tag}>`;
    }
  });
  return html;
}

function serializeBlock(node, indent = 0) {
  const pad = '  '.repeat(indent);
  const tag = node.tagName.toLowerCase();
  let attrs = '';
  // Conserve les classes CKEditor autorisées sur le bloc
  if (node.hasAttribute('class')) {
    const classes = node.getAttribute('class')
      .split(' ').filter(cls => STYLE_CLASSES.includes(cls));
    if (classes.length) {attrs += ` class="${classes.join(' ')}"`;}
  }
  if (ALLOWED_ATTRS[tag]) {
    ALLOWED_ATTRS[tag].forEach(attr => {
      if (node.hasAttribute(attr)) {attrs += ` ${attr}="${node.getAttribute(attr)}"`;}
    });
  }
	// retour à la ligne juste pour li
  if (tag === 'ul' || tag === 'ol') {
    let html = `${pad}<${tag}${attrs}>\n`;
    node.childNodes.forEach(li => {
      if (li.nodeType === Node.ELEMENT_NODE && li.tagName.toLowerCase() === 'li') {
        html += serializeBlock(li, indent + 1);
      }
    });
    html += `${pad}</${tag}>\n`;
    return html;
  }
  if (tag === 'li') {return `${pad}<li${attrs}>${serializeInline(node)}</li>\n`;}
  return `${pad}<${tag}${attrs}>${serializeInline(node)}</${tag}>\n`;
}



function prettyHTML(html) {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  let result = '';
  temp.childNodes.forEach(node => {
    if (node.nodeType === Node.ELEMENT_NODE) {result += serializeBlock(node);}
  });
  return result.trim();
}



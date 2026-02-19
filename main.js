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

const COLOR_CLASS_MAP = {
  '#1b8b84': 'text-bluSmall',
  '#a58f22': 'text-yllwDark',
  '#a12879': 'text-purpleSmall',
  '#d16e4a': 'text-cuivreDark',
  '#88165a': 'text-purplDark',
  '#db825e': 'text-cuivreSmall',
  '#1c706c': 'text-bluDark',
};
const COLOR_CLASSES = Object.values(COLOR_CLASS_MAP);
const ALLOWED_COLORS = Object.keys(COLOR_CLASS_MAP);
const STYLE_CLASSES = ['divColorBlu','divColorYlw','pBeforeUl','exempleTextItalic','ulFleche','ulFlecheCount','surlignJaune','surlignBleu','noteinfoInTab','blockquoteEncadreInfo',COLOR_CLASSES];
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
		]
		// ,
		// shouldNotGroupWhenFull: false
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
			{name: 'span', classes: STYLE_CLASSES}, 
		]
	},
	balloonToolbar: ['bold', 'italic', '|','fontColor', '|', 'link', '|', 'bulletedList', 'numberedList'],
	fontColor: {
    colors: [
      { color: '#1b8b84', label: 'Blue 1B' },
      { color: '#a58f22', label: 'Yllw dark' },
			{ color: '#a12879', label: 'Purple A1' },
      { color: '#d16e4a', label: 'cuivre dark' },
			{ color: '#88165a', label: 'Purple Dark' },
      { color: '#db825e', label: 'cuivre small' },
      { color: '#1c706c', label: 'blue Dark' },
    ],
    columns: 4, 
    documentColors: 0, // Supprime les couleurs auto
    colorPicker: false      
    },
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
			{ name: 'surlignBleu', element: 'span', classes: ['surlignBleu']}, 
			{ name: 'Div attention', element: 'p', classes: ['noteinfoInTab']}, 
			{ name: 'Encadré Info', element: 'p', classes: ['blockquoteEncadreInfo']}
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

const ALLOWED_ATTRS = { a: ['href', 'target', 'rel']};




/* ===== HTML SERIALIZER (CLE DU SYSTEME) ===== */
function serializeInline(node) {
  let html = '';
  node.childNodes.forEach(child => {
    if (child.nodeType === Node.TEXT_NODE) {html += child.textContent;
      return;
    }

    if (child.nodeType !== Node.ELEMENT_NODE) return;
    const tag = child.tagName.toLowerCase();
    let attrs = '';
    // Gestion des couleurs
    let colorClass = null;

    if (child.hasAttribute('style')) {
      const style = child.getAttribute('style');
      const match = style.match(/color\s*:\s*(#[0-9a-fA-F]{3,6})/i);

      if (match) {
        const color = match[1].toLowerCase();
        colorClass = COLOR_CLASS_MAP[color] || null;
      }
    }
    // Gestion des classes
    let allowedClasses = [];
    if (child.hasAttribute('class')) {
      allowedClasses = child.getAttribute('class')
        .split(' ').filter(cls => STYLE_CLASSES.includes(cls));
    }
    // Si couleur autorisée = on l'ajoute
    if (colorClass && !allowedClasses.includes(colorClass)) {
      allowedClasses.push(colorClass);
    }
    if (allowedClasses.length) {
      attrs += ` class="${allowedClasses.join(' ')}"`;
    }
    // Liens autorisés (garde attribut pr target blank)
    if (ALLOWED_ATTRS[tag]) {
      ALLOWED_ATTRS[tag].forEach(attr => {
        if (child.hasAttribute(attr)) {attrs += ` ${attr}="${child.getAttribute(attr)}"`;}
      });
    }
    // Suppression spans inutiles
    const hasOnlyTextStyle = tag === 'span' && !attrs;
    if (hasOnlyTextStyle) {
      html += serializeInline(child);
      return;
    }
    html += `<${tag}${attrs}>${serializeInline(child)}</${tag}>`;
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

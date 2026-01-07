window.CodePreview = {
    init: async function() {
        if (!document.getElementById('code-preview-modal')) {
             try {
                 const res = await fetch('/gui/components/CodePreview.html');
                 const text = await res.text();
                 const div = document.createElement('div');
                 div.innerHTML = text;
                 document.body.appendChild(div.firstElementChild);
             } catch(e) {
                 console.error('Failed to load CodePreview modal', e);
             }
        }
    },

    open: async function() {
        if (!document.getElementById('code-preview-modal')) await this.init();
        
        // Generate Code based on current state
        const code = this.generateCode();
        this.render(code);

        const modal = document.getElementById('code-preview-modal');
        if (modal) modal.classList.remove('hidden');
    },

    close: function() {
        const modal = document.getElementById('code-preview-modal');
        if (modal) modal.classList.add('hidden');
    },
    
    copy: function() {
        const pre = document.getElementById('code-content');
        if (!pre) return;
        
        // Get raw text from innerText or textContent (ignoring HTML tags ideally, but hidden text might be an issue if we colorize)
        // Better to regenerate raw text or store it.
        const code = this.generateCodeInternal(false); // Get raw string
        navigator.clipboard.writeText(code).then(() => {
            alert('Copied to clipboard!');
        });
    },

    generateCode: function() {
        return this.generateCodeInternal(true);
    },
    
    generateCodeInternal: function(isHtml) {
        // Collect Data
        const item = window.crudState.currentItem;
        if (!item) return isHtml ? '<span class="text-gray-500">// No endpoint selected</span>' : '// No endpoint selected';

        const root = window.crudUseProd ? window.crudProdUrl : window.crudDevUrl;
        const params = window.crudState.paramValue || '';
        const url = `${root}${item.route}${params}`;
        
        const method = item.methods || 'GET';
        // Check if STREAM
        const isStream = method === 'STREAM';
        const fetchMethod = isStream ? 'GET' : method;

        const headerVal = window.crudState.headerValue || '{}';
        const bodyVal = window.crudState.bodyValue || '{}';

        // Helper for coloring
        const kw = (t) => isHtml ? `<span class="text-pink-400 font-bold">${t}</span>` : t;
        const str = (t) => isHtml ? `<span class="text-yellow-300">"${t}"</span>` : `"${t}"`;
        const func = (t) => isHtml ? `<span class="text-green-400">${t}</span>` : t;
        const comment = (t) => isHtml ? `<span class="text-gray-500 italic">${t}</span>` : t;
        
        // Indentation
        const indent = "    ";

        let code = '';
        
        if (isStream) {
            code += `${kw('const')} response = ${kw('await')} ${func('fetch')}(${str(url)}, {\n`;
            code += `${indent}method: ${str(fetchMethod)},\n`;
            code += `${indent}headers: ${headerVal.replace(/\n/g, '\n'+indent)},\n`;
            // Stream theoretically shouldn't have body usually if GET, but if it did:
            // if (fetchMethod !== 'GET' && fetchMethod !== 'HEAD') {
            //      code += `${indent}body: JSON.stringify(${bodyVal})\n`;
            // }
            code += `});\n\n`;
            
            code += `${comment('// Handle Stream')}\n`;
            code += `${kw('const')} reader = response.body.${func('getReader')}();\n`;
            code += `${kw('const')} decoder = ${kw('new')} ${func('TextDecoder')}(${str('utf-8')});\n\n`;
            code += `${kw('while')} (${kw('true')}) {\n`;
            code += `${indent}${kw('const')} { done, value } = ${kw('await')} reader.${func('read')}();\n`;
            code += `${indent}${kw('if')} (done) ${kw('break')};\n`;
            code += `${indent}${kw('const')} chunk = decoder.${func('decode')}(value, { stream: ${kw('true')} });\n`;
            code += `${indent}${func('console')}.${func('log')}(chunk);\n`;
            code += `}`;
            
        } else {
            code += `${kw('const')} response = ${kw('await')} ${func('fetch')}(${str(url)}, {\n`;
            code += `${indent}method: ${str(fetchMethod)},\n`;
            
            // Format Headers
            let formattedHeaders = headerVal.trim();
             // Simple indent fix for display
            if (formattedHeaders.includes('\n')) {
                 formattedHeaders = formattedHeaders.split('\n').map((line, i) => i===0 ? line : indent + line).join('\n');
            }
            code += `${indent}headers: ${formattedHeaders},\n`;

            if (fetchMethod !== 'GET' && fetchMethod !== 'HEAD') {
                 let formattedBody = bodyVal.trim();
                 // Try to prettify body if it's one line
                 try {
                     const j = JSON.parse(formattedBody);
                     formattedBody = JSON.stringify(j, null, 4);
                     formattedBody = formattedBody.split('\n').map((line, i) => i===0 ? line : indent + line).join('\n');
                 } catch(e){}
                 
                 code += `${indent}body: ${func('JSON')}.${func('stringify')}(${formattedBody})\n`;
            }

            code += `});\n\n`;
            code += `${kw('const')} data = ${kw('await')} response.${func('json')}();\n`;
            code += `${func('console')}.${func('log')}(data);`;
        }

        return code;
    },

    render: function(htmlCode) {
         const el = document.getElementById('code-content');
         if (el) el.innerHTML = htmlCode;
    }
};

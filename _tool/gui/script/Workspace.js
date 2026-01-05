window.workspaceLoader = async () => {
    try {
        if (!window.workspaceNewHTML || !window.workspaceOptionsHTML || !window.workspaceCardHTML) {
            const [newRepoHtml, optsRepoHtml, cardRepoHtml] = await Promise.all([
                fetch('/gui/components/WorkspaceNew.html').then(r => r.text()),
                fetch('/gui/components/WorkspaceOption.html').then(r => r.text()),
                fetch('/gui/components/WorkspaceCard.html').then(r => r.text())
            ]);
            window.workspaceNewHTML = newRepoHtml;
            window.workspaceOptionsHTML = optsRepoHtml;
            window.workspaceCardHTML = cardRepoHtml;
        }
        document.getElementById('mount-workspace-new').innerHTML = window.workspaceNewHTML;
        document.getElementById('mount-workspace-options').innerHTML = window.workspaceOptionsHTML;
    } catch (e) {
        console.error('Error loading modal components', e);
    }

    if (!window.cardRenderer) {
        window.cardRenderer = new WorkspaceCard(window.workspaceCardHTML);
    }

    // Init Terminal in this view
    if (window.TabTerminal) {
        const mount = document.getElementById('workspace-terminal-mount');
        if (mount) {
            await window.TabTerminal.init(mount);
        }
    }

    await window.loadWorkspaceData();
}

window.loadWorkspaceData = async function () {
    if (!window.cardRenderer) return;

    try {
        const response = await fetch('/api/workspace', { cache: "no-store" });
        if (!response.ok) throw new Error('API Error');
        const data = await response.json();
        let hasItems = false;

        window.workspaceSections.forEach(section => {
            const items = data[section];
            const container = document.getElementById(`container-${section}`);
            const countEl = document.getElementById(`count-${section}`);

            if (items && items.length > 0 && container) {
                hasItems = true;
                countEl.textContent = items.length;
                let html = '';
                items.forEach((item, index) => {
                    const uniqueId = `${section}-${index}`;
                    html += window.cardRenderer.render(item, uniqueId);
                });
                container.innerHTML = html;
            } else if (container) {
                container.innerHTML = '';
                countEl.textContent = '0';
            }
        });

        if (!hasItems) {
            document.getElementById('empty-state').classList.remove('hidden');
        } else {
            document.getElementById('empty-state').classList.add('hidden');
        }

    } catch (error) {
        console.error('Error loading workspace data:', error);
        document.getElementById('empty-state').querySelector('p').textContent = 'Error loading data: ' + error.message;
        document.getElementById('empty-state').classList.remove('hidden');
    }
};

window.setupVscodeToggle = async () => {
    const btn = document.getElementById('vscode-fab-btn');

    try {
        const res = await fetch('/api/vscode/toggle-exclude', {
            method: 'POST'
        });
        const data = await res.json();

        if (data.success) {
            const icon = btn.querySelector('i');
            const span = btn.querySelector('span');

            if (data.hidden) {
                // Files are NOW HIDDEN. Next action is to SHOW.
                if (window.openAlertModal)
                        await window.openAlertModal('Success', 'Successfully hide unessential files while programming. You can now focus on editing on currently running dev servers!', 'success');

                if (icon) {
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
                if (span) span.innerText = "Show All Files";
                if (btn) {
                    btn.classList.remove('bg-blue-600');
                    btn.classList.remove('hover:bg-blue-500');
                    btn.classList.add('bg-green-600');
                    btn.classList.add('hover:bg-green-500');
                }
            } else {
                // Files are NOW VISIBLE. Next action is to HIDE.
                if (window.openAlertModal) await window.openAlertModal('Success', 'All Files Visible!', 'success');

                if (icon) {
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                }
                if (span) span.innerText = "Hide Files";
                if (btn) {
                    btn.classList.remove('bg-green-600');
                    btn.classList.remove('hover:bg-green-500');
                    btn.classList.add('bg-blue-600');
                    btn.classList.add('hover:bg-blue-500');
                }
            }
        } else {
            if (window.openAlertModal) await window.openAlertModal('Error', data.error, 'error');
        }
    } catch (e) {
        console.error(e);
        if (window.openAlertModal) await window.openAlertModal('Error', 'Request failed: ' + e, 'error');
    }


};
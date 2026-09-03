"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.default = RootLayout;
exports.metadata = {
    title: 'ApexLearn',
    description: 'Learning Management System',
};
function RootLayout({ children, }) {
    return (<html lang="en">
      <body style={{ margin: 0, padding: 0, backgroundColor: '#f4f4f9' }}>
        {children}
      </body>
    </html>);
}
//# sourceMappingURL=layout.js.map
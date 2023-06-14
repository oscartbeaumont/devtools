use tracing_core::field::Visit;

pub struct FieldVisitor {
    fields: Vec<api::Field>,
    meta_id: api::MetaId,
}

pub struct IPCVisitor {
    field_visitor: FieldVisitor,
    cmd: Option<String>,
    kind: Option<api::ipc::request::Kind>,
    line: Option<u32>,
    column: Option<u32>,
}

pub struct IPCVisitorResult {
    pub fields: Vec<api::Field>,
    pub cmd: String,
    pub kind: api::ipc::request::Kind,
    pub line: Option<u32>,
    pub column: Option<u32>,
}

impl FieldVisitor {
    pub(crate) fn new(meta_id: api::MetaId) -> Self {
        FieldVisitor {
            fields: Vec::default(),
            meta_id,
        }
    }
    pub(crate) fn result(self) -> Vec<api::Field> {
        self.fields
    }
}

impl IPCVisitor {
    pub(crate) fn new(meta_id: api::MetaId) -> Self {
        IPCVisitor {
            field_visitor: FieldVisitor::new(meta_id),
            cmd: None,
            kind: None,
            line: None,
            column: None
        }
    }
    pub(crate) fn result(self) -> Option<IPCVisitorResult> {
        let fields = self.field_visitor.result();

        if let (Some(cmd), Some(kind)) = (self.cmd, self.kind) {
            Some(IPCVisitorResult {
                fields,
                cmd,
                kind,
                line: self.line,
                column: self.column,
            })
        } else {
            None
        }
    }
}

impl Visit for FieldVisitor {
    fn record_debug(&mut self, field: &tracing_core::Field, value: &dyn std::fmt::Debug) {
        self.fields.push(api::Field {
            metadata_id: Some(self.meta_id.clone()),
            name: Some(field.name().into()),
            value: Some(value.into()),
        })
    }
}

impl Visit for IPCVisitor {
    fn record_debug(&mut self, field: &tracing_core::Field, value: &dyn std::fmt::Debug) {
        self.field_visitor.record_debug(field, value)
    }

    fn record_u64(&mut self, field: &tracing_core::Field, value: u64) {
        match field.name() {
            "loc.line" => self.line = Some(value as u32),
            "loc.column" => self.column = Some(value as u32),
            _ => self.field_visitor.record_u64(field, value),
        }
    }

    fn record_str(&mut self, field: &tracing_core::Field, value: &str) {
        match field.name() {
            "cmd" => self.cmd = Some(value.to_string()),
            "kind" => {
                let kind = match value {
                    "sync" => api::ipc::request::Kind::Sync,
                    "sync_threadpool" => api::ipc::request::Kind::SyncThreadpool,
                    "async" => api::ipc::request::Kind::Async,
                    _ => panic!(),
                };
                self.kind = Some(kind);
            }
            _ => self.field_visitor.record_str(field, value),
        }
    }
}

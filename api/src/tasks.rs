use crate::common;

mod generated {
    #![allow(warnings)]

    tonic::include_proto!("rs.tauri.devtools.tasks");
}

pub use generated::*;
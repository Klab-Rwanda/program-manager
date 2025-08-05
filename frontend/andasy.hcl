# andasy.hcl app configuration file generated for klabfrontend on Tuesday, 05-Aug-25 16:40:24 EET
#
# See https://github.com/quarksgroup/andasy-cli for information about how to use this file.

app_name = "klabfrontend"

app {

  env = {}

  port = 3000

  compute {
    cpu      = 1
    memory   = 256
    cpu_kind = "shared"
  }

  process {
    name = "klabfrontend"
  }

}

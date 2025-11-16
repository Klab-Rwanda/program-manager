# andasy.hcl app configuration file generated for program-ms on Sunday, 16-Nov-25 14:22:25 EST
#
# See https://github.com/quarksgroup/andasy-cli for information about how to use this file.

app_name = "program-ms"

app {

  env = {}

  port = 6000

  compute {
    cpu      = 1
    memory   = 256
    cpu_kind = "shared"
  }

  process {
    name = "program-ms"
  }

}
